import { MEMBER_UPLOAD_MAX_BYTES } from "@/lib/upload-limits";

/**
 * Picks a MediaRecorder MIME type that the backend accepts and the current
 * browser can encode. Exact base types win; codec-qualified variants are only
 * a fallback when the browser rejects the bare type.
 */
export function pickRecorderMimeType(
  acceptedMimeTypes: string[],
  isTypeSupported: (mimeType: string) => boolean,
): string | null {
  const bases = Array.from(
    new Set(
      acceptedMimeTypes
        .map((type) => type.split(";")[0]?.trim().toLowerCase())
        .filter((type): type is string => Boolean(type)),
    ),
  );

  for (const base of bases) {
    if (isTypeSupported(base)) {
      return base;
    }
  }

  for (const base of bases) {
    const variants =
      base === "video/webm"
        ? ["video/webm;codecs=vp9", "video/webm;codecs=vp8"]
        : base === "video/mp4"
          ? ["video/mp4;codecs=avc1.42E01E"]
          : [];

    for (const variant of variants) {
      if (isTypeSupported(variant)) {
        return variant;
      }
    }
  }

  return null;
}

export function recordingFileName(slug: string, mimeType: string): string {
  const base = baseMimeType(mimeType);
  const extension = base === "video/mp4"
    ? "mp4"
    : base === "video/quicktime"
      ? "mov"
      : "webm";

  return `rekaman-${slug || "latihan"}.${extension}`;
}

/** Strips codec parameters so the wire type matches the accepted base list. */
export function baseMimeType(mimeType: string): string {
  return mimeType.split(";")[0]?.trim().toLowerCase() || "video/webm";
}

export function effectiveUploadMaxBytes(configMaxBytes: number): number {
  if (!Number.isFinite(configMaxBytes)) {
    return MEMBER_UPLOAD_MAX_BYTES;
  }
  return Math.max(0, Math.min(configMaxBytes, MEMBER_UPLOAD_MAX_BYTES));
}

/**
 * Reads the optional retry source from a route search param without trusting
 * its shape. Repeated params are ambiguous, so only the first value is used.
 */
export function readRetryOf(
  value: string | string[] | undefined,
): string | null {
  const candidate = Array.isArray(value) ? value[0] : value;
  const trimmed = candidate?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Maps a failed upload response to member-facing copy. A `DomainErrorOut`
 * detail from the BFF wins because it is already specific; known statuses get
 * a deterministic fallback when the body is empty or not JSON.
 */
export function describeUploadFailure(
  status: number | null,
  detail?: string | null,
): string {
  const trimmed = detail?.trim();
  if (trimmed) return trimmed;

  if (status === null) {
    return "Tidak dapat terhubung ke server. Periksa koneksi lalu coba lagi.";
  }

  switch (status) {
    case 400:
      return "Permintaan unggahan tidak valid.";
    case 401:
      return "Sesi Anda tidak valid. Silakan masuk kembali.";
    case 403:
      return "Kamu tidak memiliki akses untuk mengunggah rekaman.";
    case 404:
      return "Latihan tidak ditemukan.";
    case 409:
      return "Rekaman ini sudah pernah dikirim.";
    case 410:
      return "Rekaman telah kedaluwarsa.";
    case 413:
      return "Ukuran rekaman melebihi batas.";
    case 415:
      return "Format video tidak didukung.";
    case 422:
      return "Data unggahan tidak valid.";
    case 429:
      return "Terlalu banyak percobaan. Coba lagi sebentar.";
    default:
      return status >= 500
        ? "Layanan latihan sedang bermasalah. Coba lagi beberapa saat."
        : "Gagal mengunggah rekaman.";
  }
}
