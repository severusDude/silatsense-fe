import type { CoachComparison, PoseTimeline, TimelineLandmark } from "@/api";
export function videoRect(width: number, height: number, imageWidth: number, imageHeight: number) {
  const scale = Math.min(width / imageWidth, height / imageHeight);
  const w = imageWidth * scale, h = imageHeight * scale;
  return { x: (width - w) / 2, y: (height - h) / 2, width: w, height: h };
}
export function poseAt(timeline: PoseTimeline, time: number): TimelineLandmark[] {
  const frames = timeline.frames;
  const next = frames.findIndex((frame) => frame.timeSeconds >= time);
  if (next < 0) return [];
  const right = frames[next];
  if (Math.abs(right.timeSeconds - time) < 0.00001) return right.landmarks;
  if (next === 0) return [];
  const left = frames[next - 1], gap = right.timeSeconds - left.timeSeconds;
  if (gap <= 0 || gap > (timeline.maximumInterpolationGapSeconds ?? 0.15)) return [];
  const fraction = (time - left.timeSeconds) / gap;
  return left.landmarks.flatMap((point) => {
    const other = right.landmarks.find((item) => item.index === point.index);
    return other ? [{ index: point.index, x: point.x + (other.x - point.x) * fraction,
      y: point.y + (other.y - point.y) * fraction, visibility: Math.min(point.visibility, other.visibility) }] : [];
  });
}
export type OverlayLine = { key: string; a: TimelineLandmark; b: TimelineLandmark; color: string };
const PRIORITY: Record<string, number> = { gray: 0, green: 1, yellow: 2, red: 3 };
export function overlayLines(timeline: PoseTimeline, comparison: CoachComparison | null | undefined, time: number): OverlayLine[] {
  if (!comparison) return [];
  const points = poseAt(timeline, time);
  const nearest = comparison.frames.reduce<typeof comparison.frames[number] | undefined>((best, frame) =>
    !best || Math.abs(frame.timeSeconds - time) < Math.abs(best.timeSeconds - time) ? frame : best, undefined);
  // Color is local to a measurement (at most half a pose interpolation gap), never an entire DTW bin.
  const fresh = nearest && Math.abs(nearest.timeSeconds - time) <= Math.min(0.15, timeline.maximumInterpolationGapSeconds ?? 0.15) / 2;
  const lines = new Map<string, OverlayLine>();
  const joints = fresh ? Object.values(nearest.joints) : Object.values(comparison.frames[0]?.joints ?? {});
  for (const joint of joints) {
    const color = fresh && joint.value !== null && joint.referenceValue !== null && !joint.reason ? joint.color ?? "gray" : "gray";
    for (let index = 0; index < joint.landmarkIndices.length - 1; index++) {
      const ai = joint.landmarkIndices[index], bi = joint.landmarkIndices[index + 1];
      const a = points.find((point) => point.index === ai), b = points.find((point) => point.index === bi);
      if (!a || !b || a.visibility < 0.5 || b.visibility < 0.5) continue;
      const key = [ai, bi].sort((x, y) => x - y).join("-");
      if (!lines.has(key) || PRIORITY[color] > PRIORITY[lines.get(key)!.color]) lines.set(key, { key, a, b, color });
    }
  }
  return [...lines.values()];
}
export function comparisonMessage(code: string | null | undefined): string {
  if (!code) return "Tidak ada catatan penyimpangan.";
  const labels: Record<string, string> = {
    lebih_menekuk_dari_referensi: "Lebih menekuk dibanding demonstrasi Coach.",
    lebih_lurus_dari_referensi: "Lebih lurus dibanding demonstrasi Coach.",
    sudut_berbeda_dari_referensi: "Sudut berbeda dibanding demonstrasi Coach.",
    joint_not_observable: "Sendi tidak terlihat cukup jelas.", tolerance_pending: "Rentang referensi belum tersedia.",
    insufficient_pose: "Pose belum cukup terlihat untuk dibandingkan.", insufficient_features: "Fitur teramati belum cukup untuk dibandingkan.",
    reference_model_unavailable: "Model referensi belum tersedia.", reference_version_unavailable: "Versi referensi belum tersedia.",
    reference_configuration_required: "Konfigurasi referensi belum tersedia.", correctness_not_validated: "Penilaian benar atau salah belum tervalidasi.",
  };
  return labels[code] ?? "Data ini belum dapat dinilai. Minta pelatih meninjau rekaman.";
}
