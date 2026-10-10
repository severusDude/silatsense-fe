import type {
  CameraDevice,
  PersiapanSlug,
  RekamSession,
} from "@/features/member/types";
import {
  defaultCameraId,
  dummyCameras,
} from "@/features/member/data/persiapan-dummy";

// Viewfinder chrome (badges, timer) is derived live, never stored: the top
// badge resolves from the open stream via qualityLabel() with a "Siaga"
// fallback, and the bottom overlay is a live camera Select. The dummy only
// carries screen copy + the default-selected device.
const fallbackCamera: CameraDevice =
  dummyCameras.find((camera) => camera.id === defaultCameraId) ?? {
    id: "integrated",
    label: "Kamera Terintegrasi",
    resolution: "1280×720",
    fps: 30,
    latencyMs: null,
  };

function rekamSession(
  slug: PersiapanSlug,
  trainingName: string,
): RekamSession {
  return {
    slug,
    trainingName,
    eyebrow: "MULAI LATIHAN",
    countdownSec: 3,
    targetDurationSec: 60,
    camera: fallbackCamera,
  };
}

export const dummyRekamBySlug: Record<PersiapanSlug, RekamSession> = {
  "kuda-kuda": rekamSession("kuda-kuda", "Kuda-kuda"),
  pukulan: rekamSession("pukulan", "Pukulan"),
  tangkisan: rekamSession("tangkisan", "Tangkisan"),
  tendangan: rekamSession("tendangan", "Tendangan"),
};
