/** Round fractional sensor FPS (e.g. 60.00024, 29.97) for display. */
export function formatFps(fps: number): number {
  return Math.round(fps);
}

/** Live quality badge from an open stream's settings; null while idle. */
export function qualityLabel(
  width: number | undefined,
  height: number | undefined,
  fps: number | undefined,
): string | null {
  if (!width || !height || fps === undefined) return null;
  return `${height}p @ ${Math.round(fps)} FPS`;
}

function cameraErrorName(error: unknown): string {
  if (typeof error !== "object" || error === null || !("name" in error)) {
    return "";
  }
  const name = (error as { name?: unknown }).name;
  return typeof name === "string" ? name : "";
}

/**
 * Turns a browser media error into copy that tells the member what to do next.
 * The hook owns the error state; this helper keeps the wording testable.
 */
export function describeCameraError(error: unknown): string {
  switch (cameraErrorName(error)) {
    case "NotAllowedError":
    case "SecurityError":
      return "Izin kamera ditolak. Izinkan akses kamera di pengaturan situs, lalu pindai ulang.";
    case "NotFoundError":
    case "DevicesNotFoundError":
    case "OverconstrainedError":
      return "Kamera tidak ditemukan. Sambungkan kamera lalu pindai ulang.";
    case "NotReadableError":
    case "TrackStartError":
    case "AbortError":
      return "Kamera sedang dipakai aplikasi lain. Tutup aplikasi tersebut lalu pindai ulang.";
    case "TypeError":
      return "Akses kamera memerlukan HTTPS atau localhost.";
    default:
      return "Kamera tidak dapat dibuka. Periksa izin browser lalu pindai ulang.";
  }
}
