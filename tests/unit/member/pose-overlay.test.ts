import { describe, it, expect } from "vitest";
import type { PoseTimeline, CoachComparison } from "@/api";
import { poseAt, videoRect, overlayLines, comparisonMessage } from "@/features/member/pose-overlay";
const points = (x: number, visibility = 1) => [0, 1, 2].map((index) => ({ index, x, y: 0.5, visibility }));
const timeline: PoseTimeline = { coordinateSystem: "image-normalized", origin: "top-left", imageWidth: 1920, imageHeight: 1080, maximumInterpolationGapSeconds: 0.15, frames: [{ frameIndex: 0, timeSeconds: 0, landmarks: points(0) }, { frameIndex: 1, timeSeconds: 0.1, landmarks: points(1) }, { frameIndex: 2, timeSeconds: 1, landmarks: points(0) }] };
const joint = (color: "red" | "green" | "yellow" | null) => ({ value: 90, referenceValue: 80, deviation: 10, unit: "deg" as const, color, reason: null, landmarkIndices: [0, 1, 2] as [number, number, number], feedbackCode: null });
export const comparison: CoachComparison = { movementId: "pukulan_depan", status: "compared", toleranceStatus: "ready", frames: [{ timeSeconds: 0.05, referenceTimeSeconds: 0.03, phase: null, features: {}, joints: { elbow: joint("red"), shared: joint("green") } }], features: {} };
describe("pose time and image geometry", () => {
 it("uses letterboxed image area in a square viewport", () => { expect(videoRect(400, 400, 1920, 1080)).toEqual({ x: 0, y: 87.5, width: 400, height: 225 }); });
 it("accounts for pillarboxing and resized/fullscreen dimensions", () => { expect(videoRect(800, 400, 400, 400)).toEqual({ x: 200, y: 0, width: 400, height: 400 }); });
 it("interpolates only between actual observations inside the API gap", () => { expect(poseAt(timeline, 0.05)[0].x).toBeCloseTo(0.5); });
 it("never bridges long gaps or extrapolates past video observations", () => { expect(poseAt(timeline, 0.5)).toEqual([]); expect(poseAt(timeline, -0.1)).toEqual([]); expect(poseAt(timeline, 1.1)).toEqual([]); });
 it("uses red priority for shared edges and honors seek time", () => { expect(overlayLines(timeline, comparison, 0.05).map((line) => line.color)).toEqual(["red", "red"]); expect(overlayLines(timeline, comparison, 0.5)).toEqual([]); });
 it("never extends comparison colors across sparse temporal bins", () => { expect(overlayLines(timeline, comparison, 1).map((line) => line.color)).toEqual(["gray", "gray"]); });
 it("hides unobservable points and uses gray for nullable measurements", () => {
   const hidden = { ...timeline, frames: [{ frameIndex: 0, timeSeconds: 0.05, landmarks: points(0.5, 0.1) }] };
   expect(overlayLines(hidden, comparison, 0.05)).toEqual([]);
   const nullable = { ...comparison, frames: [{ ...comparison.frames[0], joints: { elbow: { ...joint(null), value: null } } }] };
   expect(overlayLines(timeline, nullable, 0.05).every((line) => line.color === "gray")).toBe(true);
 });
 it("handles empty timelines and unavailable comparisons", () => { expect(poseAt({ ...timeline, frames: [] }, 0)).toEqual([]); expect(overlayLines(timeline, null, 0)).toEqual([]); });
 it("translates feedback without asserting technical correctness", () => { expect(comparisonMessage("lebih_menekuk_dari_referensi")).toContain("Lebih menekuk"); expect(comparisonMessage("unknown_code")).toContain("belum dapat dinilai"); });
});
