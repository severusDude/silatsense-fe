import { baseMimeType } from "@/features/member/recorder";
import { formatBytes } from "@/features/member/data/format";
import type { RecordedClip } from "@/features/member/types";

export interface VideoFileLimits {
  acceptedMimeTypes: string[];
  maxBytes: number;
  maxDurationSec: number;
}

const FILE_TYPES: Record<string, string> = {
  mp4: "video/mp4",
  mov: "video/quicktime",
  webm: "video/webm",
};

/** Filename fallback is only for browsers that omit File.type; BE checks actual bytes. */
export function validateVideoFile(file: File, limits: VideoFileLimits): string {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  const mimeType = file.type ? baseMimeType(file.type) : FILE_TYPES[extension];
  if (!mimeType || FILE_TYPES[extension] !== mimeType || !limits.acceptedMimeTypes.includes(mimeType)) {
    throw new Error("Format video tidak didukung. Pilih video sesuai format yang tercantum.");
  }
  if (file.size === 0) throw new Error("File video kosong. Pilih video lain.");
  if (file.size > limits.maxBytes) {
    throw new Error(`Ukuran video melebihi batas ${formatBytes(limits.maxBytes)}.`);
  }
  if (file.name.length > 255) throw new Error("Nama file terlalu panjang. Pendekkan nama video lalu pilih lagi.");
  return mimeType;
}

export function validateVideoDuration(duration: number, maxDuration: number): void {
  if (!Number.isFinite(duration) || duration <= 0) {
    throw new Error("Durasi video tidak dapat dibaca. Ekspor ulang video ke MP4 lalu pilih lagi.");
  }
  if (duration > maxDuration) {
    throw new Error(`Durasi video melebihi batas ${maxDuration} detik. Potong video lalu pilih lagi.`);
  }
}

export function videoFileAccept(acceptedMimeTypes: string[]): string {
  return Object.entries(FILE_TYPES)
    .filter(([, mime]) => acceptedMimeTypes.includes(mime))
    .flatMap(([extension, mime]) => [mime, `.${extension}`])
    .join(",");
}

/** Read metadata locally. Every failed/cancelled selection releases its object URL. */
export async function prepareVideoFile(
  file: File,
  limits: VideoFileLimits,
  signal: AbortSignal,
): Promise<RecordedClip> {
  const mimeType = validateVideoFile(file, limits);
  signal.throwIfAborted();
  const previewUrl = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.preload = "metadata";
  try {
    const duration = await new Promise<number>((resolve, reject) => {
      const cleanup = () => {
        clearTimeout(timeout);
        video.onloadedmetadata = null;
        video.onerror = null;
        signal.removeEventListener("abort", abort);
      };
      const fail = (message: string) => { cleanup(); reject(new Error(message)); };
      const abort = () => fail("Pemilihan video dibatalkan.");
      const timeout = setTimeout(() => fail("Video terlalu lama dibaca. Pilih video lain."), 15_000);
      signal.addEventListener("abort", abort, { once: true });
      video.onerror = () => fail("Video tidak dapat dibaca browser. Coba file MP4 dengan codec H.264.");
      video.onloadedmetadata = () => { cleanup(); resolve(video.duration); };
      video.src = previewUrl;
    });
    signal.throwIfAborted();
    validateVideoDuration(duration, limits.maxDurationSec);
    return {
      blob: file, previewUrl, durationSec: duration, byteSize: file.size,
      mimeType, fileName: file.name, source: "file",
    };
  } catch (error) {
    URL.revokeObjectURL(previewUrl);
    throw error;
  } finally {
    video.removeAttribute("src");
    video.load();
  }
}
