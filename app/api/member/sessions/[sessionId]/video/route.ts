import { getAccessToken } from "@/features/auth/data/session";
import { client } from "@/lib/api-client";
import {
  domainErrorResponse,
  upstreamDomainErrorResponse,
} from "@/lib/domain-error-response";

export const maxDuration = 60;

const FORWARDED_RESPONSE_HEADERS = [
  "Content-Type",
  "Content-Length",
  "Content-Range",
  "Accept-Ranges",
] as const;

function videoFailureFallback(status: number | undefined): {
  detail: string;
  code: string;
} {
  switch (status) {
    case 401:
      return {
        detail: "Sesi Anda tidak valid. Silakan masuk kembali.",
        code: "UNAUTHORIZED",
      };
    case 403:
      return {
        detail: "Anda tidak memiliki akses ke rekaman ini.",
        code: "FORBIDDEN",
      };
    case 404:
      return { detail: "Rekaman tidak ditemukan.", code: "NOT_FOUND" };
    case 410:
      return { detail: "Rekaman sudah tidak tersedia.", code: "GONE" };
    case 416:
      return {
        detail: "Rentang video tidak dapat dipenuhi.",
        code: "RANGE_NOT_SATISFIABLE",
      };
    case 429:
      return {
        detail: "Terlalu banyak permintaan. Coba lagi sebentar.",
        code: "RATE_LIMITED",
      };
    default:
      return { detail: "Gagal memuat rekaman.", code: "VIDEO_UNAVAILABLE" };
  }
}

/**
 * Authenticated video stream proxy.
 *
 * `<video>` cannot attach a Bearer header, so this handler forwards the Range
 * request and the backend's `200`/`206` response (body and range headers)
 * without buffering or transforming the media.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
): Promise<Response> {
  const token = await getAccessToken();
  if (!token) {
    return domainErrorResponse(
      401,
      "Sesi Anda tidak valid. Silakan masuk kembali.",
      "UNAUTHORIZED",
    );
  }

  const { sessionId } = await params;
  const range = request.headers.get("range");

  const { data, error, response } = await client.get({
    url: "/api/v1/member/sessions/{session_id}/video",
    path: { session_id: sessionId },
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": null,
      ...(range ? { Range: range } : {}),
    },
    parseAs: "stream",
    cache: "no-store",
    throwOnError: false,
  });

  if (!response?.ok) {
    return upstreamDomainErrorResponse(
      response?.status,
      error,
      videoFailureFallback(response?.status),
    );
  }

  if (!(data instanceof ReadableStream)) {
    return domainErrorResponse(
      502,
      "Rekaman tidak tersedia.",
      "VIDEO_UNAVAILABLE",
    );
  }

  const headers = new Headers({ "Cache-Control": "private, no-store" });
  for (const name of FORWARDED_RESPONSE_HEADERS) {
    const value = response.headers.get(name);
    if (value !== null) {
      headers.set(name, value);
    }
  }

  return new Response(data, {
    status: response.status,
    headers,
  });
}
