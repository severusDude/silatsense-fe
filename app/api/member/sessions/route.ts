import { createHash } from "node:crypto";
import {
  zAcceptedSession,
  zUploadRequest,
  zUploadTicket,
} from "@/api/zod.gen";
import { getAccessToken } from "@/features/auth/data/session";
import { formatBytes } from "@/features/member/data/format";
import { baseMimeType, recordingFileName } from "@/features/member/recorder";
import { client } from "@/lib/api-client";
import {
  domainErrorResponse,
  upstreamDomainErrorResponse,
} from "@/lib/domain-error-response";
import { MEMBER_UPLOAD_MAX_BYTES } from "@/lib/upload-limits";

export const maxDuration = 60;

const IDEMPOTENCY_KEY_MAX_LENGTH = 128;

function tooLargeResponse(): Response {
  return domainErrorResponse(
    413,
    `Ukuran rekaman melebihi batas ${formatBytes(MEMBER_UPLOAD_MAX_BYTES)}.`,
    "PAYLOAD_TOO_LARGE",
  );
}

function uploadFailureFallback(status: number | undefined): {
  detail: string;
  code: string;
} {
  switch (status) {
    case 413:
      return {
        detail: `Ukuran rekaman melebihi batas ${formatBytes(MEMBER_UPLOAD_MAX_BYTES)}.`,
        code: "PAYLOAD_TOO_LARGE",
      };
    case 415:
      return {
        detail: "Format rekaman tidak didukung.",
        code: "UNSUPPORTED_MEDIA_TYPE",
      };
    case 422:
      return {
        detail: "Data unggahan tidak valid.",
        code: "VALIDATION_ERROR",
      };
    case 429:
      return {
        detail: "Terlalu banyak permintaan. Coba lagi sebentar.",
        code: "RATE_LIMITED",
      };
    default:
      return { detail: "Gagal mengunggah rekaman.", code: "UPLOAD_FAILED" };
  }
}

/**
 * Transport-only BFF seam for the member video upload.
 *
 * The access token is HttpOnly and the object storage bucket does not expose
 * browser CORS headers, so this route executes the backend's 3-step upload
 * flow server-side (`POST /api/v1/member/uploads` -> `PUT` to pre-signed B2
 * URL -> `POST /api/v1/member/uploads/{upload_id}/complete`). It is excluded
 * from the `proxy.ts` matcher so the proxy does not buffer the body before
 * this handler runs.
 */
export async function POST(request: Request): Promise<Response> {
  const token = await getAccessToken();
  if (!token) {
    return domainErrorResponse(
      401,
      "Sesi Anda tidak valid. Silakan masuk kembali.",
      "UNAUTHORIZED",
    );
  }

  const idempotencyKey = request.headers.get("idempotency-key")?.trim() ?? "";
  if (
    idempotencyKey.length < 1 ||
    idempotencyKey.length > IDEMPOTENCY_KEY_MAX_LENGTH
  ) {
    return domainErrorResponse(
      400,
      "Header Idempotency-Key wajib diisi (1–128 karakter).",
      "VALIDATION_ERROR",
    );
  }

  const declaredLength = request.headers.get("content-length");
  if (declaredLength !== null) {
    const contentLength = Number(declaredLength);
    if (!Number.isFinite(contentLength) || contentLength < 0) {
      return domainErrorResponse(
        400,
        "Header Content-Length tidak valid.",
        "VALIDATION_ERROR",
      );
    }
    if (contentLength > MEMBER_UPLOAD_MAX_BYTES) {
      return tooLargeResponse();
    }
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return domainErrorResponse(
      415,
      "Unggahan harus berupa multipart/form-data.",
      "UNSUPPORTED_MEDIA_TYPE",
    );
  }

  const movementSlug = form.get("movementSlug");
  const video = form.get("video");
  const retryOf = form.get("retryOf");

  if (typeof movementSlug !== "string" || movementSlug.trim() === "") {
    return domainErrorResponse(
      422,
      "Gerakan latihan wajib diisi.",
      "VALIDATION_ERROR",
    );
  }

  if (!(video instanceof File) || video.size === 0) {
    return domainErrorResponse(
      422,
      "Berkas rekaman wajib diunggah.",
      "VALIDATION_ERROR",
    );
  }

  if (video.size > MEMBER_UPLOAD_MAX_BYTES) {
    return tooLargeResponse();
  }

  if (retryOf !== null && typeof retryOf !== "string") {
    return domainErrorResponse(
      422,
      "Nilai retryOf tidak valid.",
      "VALIDATION_ERROR",
    );
  }

  const normalizedMimeType = baseMimeType(video.type || "video/webm");
  const normalizedSlug = movementSlug.trim();
  const normalizedFilename = (
    video.name.trim() || recordingFileName(normalizedSlug, normalizedMimeType)
  ).slice(0, 255);
  const bytes = new Uint8Array(await video.arrayBuffer());
  const sha256 = createHash("sha256").update(bytes).digest("hex");

  const uploadRequestParsed = zUploadRequest.safeParse({
    movementSlug: normalizedSlug,
    filename: normalizedFilename,
    mimeType: normalizedMimeType,
    byteSize: video.size,
    sha256,
    ...(typeof retryOf === "string" && retryOf.trim() !== ""
      ? { retryOf: retryOf.trim() }
      : {}),
  });

  if (!uploadRequestParsed.success) {
    const hasMimeIssue = uploadRequestParsed.error.issues.some((issue) =>
      issue.path.includes("mimeType"),
    );
    if (hasMimeIssue) {
      return domainErrorResponse(
        415,
        "Format rekaman tidak didukung.",
        "UNSUPPORTED_MEDIA_TYPE",
      );
    }
    return domainErrorResponse(
      422,
      "Data unggahan tidak valid.",
      "VALIDATION_ERROR",
    );
  }

  const initResult = await client.post({
    url: "/api/v1/member/uploads",
    body: uploadRequestParsed.data,
    headers: {
      Authorization: `Bearer ${token}`,
      "Idempotency-Key": idempotencyKey,
    },
    cache: "no-store",
    throwOnError: false,
  });

  if (!initResult.response?.ok) {
    return upstreamDomainErrorResponse(
      initResult.response?.status,
      initResult.error,
      uploadFailureFallback(initResult.response?.status),
    );
  }

  const ticketParsed = zUploadTicket.safeParse(initResult.data);
  if (!ticketParsed.success) {
    return domainErrorResponse(
      502,
      "Respons server tidak dikenali.",
      "SCHEMA_MISMATCH",
    );
  }

  const ticket = ticketParsed.data;
  if (ticket.acceptedSession) {
    return Response.json(ticket.acceptedSession, {
      status: 202,
      headers: { "Cache-Control": "no-store" },
    });
  }

  if (!ticket.uploadUrl) {
    return domainErrorResponse(
      502,
      "Respons server tidak dikenali.",
      "SCHEMA_MISMATCH",
    );
  }

  let storageResponse: Response;
  try {
    storageResponse = await fetch(ticket.uploadUrl, {
      method: ticket.method,
      headers: ticket.headers,
      body: bytes,
    });
  } catch {
    return domainErrorResponse(
      502,
      "Gagal mengunggah rekaman ke penyimpanan.",
      "STORAGE_UPLOAD_FAILED",
    );
  }

  if (!storageResponse.ok) {
    return domainErrorResponse(
      502,
      "Gagal mengunggah rekaman ke penyimpanan.",
      "STORAGE_UPLOAD_FAILED",
    );
  }

  const completeResult = await client.post({
    url: "/api/v1/member/uploads/{upload_id}/complete",
    path: { upload_id: ticket.uploadId },
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
    throwOnError: false,
  });

  if (!completeResult.response?.ok) {
    return upstreamDomainErrorResponse(
      completeResult.response?.status,
      completeResult.error,
      uploadFailureFallback(completeResult.response?.status),
    );
  }

  const parsed = zAcceptedSession.safeParse(completeResult.data);
  if (!parsed.success) {
    return domainErrorResponse(
      502,
      "Respons server tidak dikenali.",
      "SCHEMA_MISMATCH",
    );
  }

  return Response.json(parsed.data, {
    status: 202,
    headers: { "Cache-Control": "no-store" },
  });
}
