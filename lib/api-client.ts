export { client } from "@/api/client.gen";

export const RETRYABLE_STATUS_CODES = new Set([500, 502, 503, 504]);
export const MAX_RETRIES = 2;
export const BASE_DELAY_MS = 500;

export async function fetchWithTransientRetry(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const rawMethod = init?.method ?? (input instanceof Request ? input.method : "GET");
  const method = (rawMethod || "GET").toUpperCase();
  const isIdempotent = method === "GET" || method === "HEAD";
  const maxAttempts = isIdempotent ? MAX_RETRIES : 0;

  for (let attempt = 0; attempt <= maxAttempts; attempt++) {
    try {
      const target = input instanceof Request ? input.clone() : input;
      const response = await fetch(target, init);

      if (!isIdempotent || !RETRYABLE_STATUS_CODES.has(response.status) || attempt === maxAttempts) {
        return response;
      }
    } catch (err) {
      if (!isIdempotent || attempt === maxAttempts) {
        throw err;
      }
    }

    const delay = BASE_DELAY_MS * Math.pow(2, attempt) + Math.random() * 100;
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  throw new Error("Unexpected end of fetch retry loop");
}

export type NormalizedApiError = {
  message: string;
  code?: string;
  fieldErrors?: Record<string, string>;
};

export function normalizeApiError(error: unknown, response?: Response): NormalizedApiError {
  if (response?.status === 429) {
    return {
      message: "Terlalu banyak percobaan. Coba lagi sebentar.",
      code: "RATE_LIMITED",
    };
  }

  if (typeof error === "object" && error !== null) {
    const errObj = error as Record<string, unknown>;

    // FastAPI 422 validation error: { detail: [{ loc: [...], msg: "..." }] }
    if (Array.isArray(errObj.detail)) {
      const fieldErrors: Record<string, string> = {};
      let firstMsg = "";

      for (const item of errObj.detail) {
        if (typeof item === "object" && item !== null) {
          const detailItem = item as { loc?: (string | number)[]; msg?: string };
          const msg = detailItem.msg ?? "Input tidak valid";
          if (!firstMsg) firstMsg = msg;
          if (Array.isArray(detailItem.loc) && detailItem.loc.length > 0) {
            const lastLoc = detailItem.loc[detailItem.loc.length - 1];
            if (typeof lastLoc === "string") {
              fieldErrors[lastLoc] = msg;
            }
          }
        }
      }

      return {
        message: firstMsg || "Input tidak valid",
        code: "VALIDATION_ERROR",
        fieldErrors: Object.keys(fieldErrors).length > 0 ? fieldErrors : undefined,
      };
    }

    // Domain error: { detail: string, code?: string, requestId?: string }
    if (typeof errObj.detail === "string") {
      return {
        message: errObj.detail,
        code: typeof errObj.code === "string" ? errObj.code : undefined,
      };
    }

    // Error instance (e.g. Zod validation failure or network fetch error)
    if (error instanceof Error) {
      if (error.name === "ZodError") {
        return {
          message: "Respons server tidak dikenali",
          code: "SCHEMA_MISMATCH",
        };
      }
      return {
        message: error.message || "Terjadi kesalahan pada sistem",
      };
    }
  }

  if (typeof error === "string") {
    return { message: error };
  }

  return {
    message: "Tidak dapat terhubung ke server",
  };
}
