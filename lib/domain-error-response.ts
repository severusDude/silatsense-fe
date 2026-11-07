import "server-only";

import type { DomainErrorOut } from "@/api";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" } as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/**
 * Builds a `DomainErrorOut`-shaped JSON response for errors that originate in
 * the BFF route itself (auth, validation, size limits, schema mismatch).
 */
export function domainErrorResponse(
  status: number,
  detail: string,
  code: string,
): Response {
  const body: DomainErrorOut = {
    detail,
    code,
    requestId: crypto.randomUUID(),
  };

  return Response.json(body, {
    status,
    headers: NO_STORE_HEADERS,
  });
}

/**
 * Forwards an upstream domain error when it has the expected shape, and falls
 * back to a local message when the body is empty or not JSON. Raw upstream text
 * (HTML error pages, proxy messages) is never exposed to the browser.
 */
export function upstreamDomainErrorResponse(
  status: number | undefined,
  error: unknown,
  fallback: { detail: string; code: string },
): Response {
  const resolvedStatus =
    status !== undefined && status >= 400 && status <= 599 ? status : 502;

  if (isRecord(error) && typeof error.detail === "string") {
    const body: DomainErrorOut = {
      detail: error.detail,
      code: typeof error.code === "string" ? error.code : fallback.code,
      requestId:
        typeof error.requestId === "string"
          ? error.requestId
          : crypto.randomUUID(),
    };

    return Response.json(body, {
      status: resolvedStatus,
      headers: NO_STORE_HEADERS,
    });
  }

  return domainErrorResponse(resolvedStatus, fallback.detail, fallback.code);
}
