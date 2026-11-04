import { zAcceptedSession } from "@/api/zod.gen";
import { getAccessToken } from "@/features/auth/data/session";
import { formatBytes } from "@/features/member/data/format";
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
 * The access token is HttpOnly, so the browser cannot call the backend
 * directly. This route forwards the multipart body and auth headers without
 * shaping the payload. It is excluded from the `proxy.ts` matcher so the proxy
 * does not buffer the body before this handler runs.
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

  const body = new FormData();
  body.set("movementSlug", movementSlug.trim());
  body.set("video", video, video.name);
  if (typeof retryOf === "string" && retryOf.trim() !== "") {
    body.set("retryOf", retryOf.trim());
  }

  const { data, error, response } = await client.post({
    url: "/api/v1/member/sessions",
    body,
    bodySerializer: null,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": null,
      "Idempotency-Key": idempotencyKey,
    },
    cache: "no-store",
    throwOnError: false,
  });

  if (!response?.ok) {
    return upstreamDomainErrorResponse(
      response?.status,
      error,
      uploadFailureFallback(response?.status),
    );
  }

  const parsed = zAcceptedSession.safeParse(data);
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
