import type { ZodError } from "zod";
import { normalizeApiError, type NormalizedApiError } from "@/lib/api-client";

const STATUS_MESSAGES: Record<number, string> = {
  400: "Permintaan tidak valid.",
  401: "Sesi berakhir. Silakan masuk kembali.",
  403: "Anda tidak memiliki akses ke fitur ini.",
  404: "Data tidak ditemukan.",
  409: "Ulasan telah berubah. Muat ulang lalu coba lagi.",
  422: "Data yang dikirim tidak valid.",
  500: "Layanan ulasan sedang bermasalah. Coba lagi beberapa saat.",
  503: "Layanan ulasan sedang bermasalah. Coba lagi beberapa saat.",
};

function domainDetail(error: unknown): string {
  if (typeof error !== "object" || error === null || !("detail" in error)) {
    return "";
  }
  const detail = (error as { detail?: unknown }).detail;
  return typeof detail === "string" ? detail.trim() : "";
}

export function toCoachActionError(
  error: unknown,
  response?: Response,
): NormalizedApiError {
  const normalized = normalizeApiError(error, response);

  const status = response?.status;
  let code = normalized.code;

  if (status === 401) {
    code = "UNAUTHORIZED";
  } else if (status === 409) {
    code = "CONFLICT";
  } else if (status === 422) {
    code = "VALIDATION_FAILED";
  } else if (status && status >= 500) {
    code = "SERVER_ERROR";
  }

  const detailText = domainDetail(error);
  if (detailText) {
    return { ...normalized, message: detailText, code };
  }

  const fallback = status
    ? STATUS_MESSAGES[status]
    : "Tidak dapat terhubung ke server. Periksa koneksi lalu coba lagi.";

  return { ...normalized, message: fallback ?? normalized.message, code };
}

export function invalidInputFailure(error: ZodError): {
  ok: false;
  error: NormalizedApiError;
} {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field === "string") {
      fieldErrors[field] = issue.message;
    }
  }

  return {
    ok: false,
    error: {
      message: error.issues[0]?.message ?? "Input tidak valid",
      code: "VALIDATION_FAILED",
      fieldErrors,
    },
  };
}
