import type { CoachComparison } from "@/api";

const REFERENCE_KNEE_DEGREES = 110;
const ANGLE_TOLERANCE_DEGREES = 10;
const MIN_STANCE_WIDTH_TORSO = 1.2;

export function assessSideStance(comparison: CoachComparison) {
  if (comparison.movementId !== "kuda_kuda_samping" || comparison.status !== "compared") {
    return null;
  }

  const samples = comparison.frames.map(({ features }) => {
    const left = features.left_knee_deg?.value;
    const right = features.right_knee_deg?.value;
    const width = features.stance_width_torso?.value;
    if (left == null || right == null || width == null) return null;
    return { knee: Math.min(left, right), width };
  });
  const widest = Math.max(0, ...samples.map((sample) => sample?.width ?? 0));
  const minimumWidth = Math.max(MIN_STANCE_WIDTH_TORSO, widest * 0.85);

  // Use a sustained bend inside the stance rather than one potentially noisy frame.
  const kneeAngles: number[] = [];
  for (let index = 1; index < samples.length - 1; index++) {
    const before = samples[index - 1];
    const current = samples[index];
    const after = samples[index + 1];
    if (!before || !current || !after) continue;
    if (Math.min(before.width, current.width, after.width) < minimumWidth) continue;
    const angles = [before.knee, current.knee, after.knee].sort((a, b) => a - b);
    kneeAngles.push(angles[1]);
  }
  if (kneeAngles.length === 0) return null;

  const knee = Math.min(...kneeAngles);
  const difference = knee - REFERENCE_KNEE_DEGREES;
  return {
    points: Math.max(0, Math.round(100 - Math.max(0, Math.abs(difference) - ANGLE_TOLERANCE_DEGREES))),
    correction: difference > ANGLE_TOLERANCE_DEGREES
      ? "Tekuk sedikit lagi lutut agar posisi badan lebih rendah."
      : difference < -ANGLE_TOLERANCE_DEGREES
        ? "Kurangi sedikit tekukan lutut agar lebih dekat dengan contoh Coach."
        : null,
  };
}
