import type { ZodError } from "zod";
import { normalizeApiError, type NormalizedApiError } from "@/lib/api-client";

const STATUS_MESSAGES: Record<number, string> = {
  400: "Permintaan tidak valid.",
  401: "Sesi Anda tidak valid. Silakan masuk kembali.",
  403: "Kamu tidak memiliki akses ke sesi ini.",
  404: "Sesi tidak ditemukan.",
  409: "Tindakan ini tidak dapat dilakukan saat ini.",
  410: "Rekaman telah kedaluwarsa.",
  413: "Ukuran rekaman melebihi batas.",
  416: "Rentang video tidak valid.",
  422: "Data yang dikirim tidak valid.",
  429: "Terlalu banyak percobaan. Coba lagi sebentar.",
  500: "Layanan latihan sedang bermasalah. Coba lagi beberapa saat.",
  503: "Layanan latihan sedang bermasalah. Coba lagi beberapa saat.",
};

function domainDetail(error: unknown): string {
  if (typeof error !== "object" || error === null || !("detail" in error)) {
    return "";
  }
  const detail = (error as { detail?: unknown }).detail;
  return typeof detail === "string" ? detail.trim() : "";
}

/**
 * Turns an SDK failure into member-facing copy. A `DomainErrorOut.detail`
 * already carries specific Indonesian text, so it wins over status copy.
 */
export function toSessionActionError(
  error: unknown,
  response?: Response,
): NormalizedApiError {
  const normalized = normalizeApiError(error, response);

  if (normalized.code === "VALIDATION_ERROR" || domainDetail(error)) {
    return normalized;
  }

  const status = response?.status;
  const fallback = status
    ? STATUS_MESSAGES[status]
    : "Tidak dapat terhubung ke server. Periksa koneksi lalu coba lagi.";

  return fallback ? { ...normalized, message: fallback } : normalized;
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
      code: "VALIDATION_ERROR",
      fieldErrors,
    },
  };
}
