import type {
  CameraDevice,
  PersiapanSlug,
  TrainingSession,
} from "@/features/member/types";
import {
  defaultCameraId,
  dummyCameras,
} from "@/features/member/data/persiapan-dummy";

const fallbackCamera: CameraDevice =
  dummyCameras.find((camera) => camera.id === defaultCameraId) ?? {
    id: "integrated",
    label: "Kamera Terintegrasi",
    resolution: "1280×720",
    fps: 30,
    latencyMs: null,
  };

function sesiSession(
  slug: PersiapanSlug,
  trainingName: string,
): TrainingSession {
  return {
    slug,
    trainingName,
    eyebrow: "ULASAN SESI",
    durationSec: 47,
    durationLabel: "00:47",
    recordedAtLabel: "10 Okt 2026 • 09.41",
    fileSizeLabel: "18,2 MB",
    camera: fallbackCamera,
    videoStatus: "recorded",
  };
}

export const dummySesiBySlug: Record<PersiapanSlug, TrainingSession> = {
  "kuda-kuda": sesiSession("kuda-kuda", "Kuda-kuda"),
  pukulan: sesiSession("pukulan", "Pukulan"),
  tangkisan: sesiSession("tangkisan", "Tangkisan"),
  tendangan: sesiSession("tendangan", "Tendangan"),
};
