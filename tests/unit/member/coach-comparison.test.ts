import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, it, expect } from "vitest";
import { CoachComparisonPanel } from "@/features/member/components/coach-comparison";
import type { CoachComparison } from "@/api";
describe("temporal comparison presentation", () => {
 it("renders null measurements, torso ratios, sample coverage and feedback without fabricating a score", () => {
  const comparison: CoachComparison = { movementId: "pukulan_bandul", status: "compared", toleranceStatus: "ready", alignmentDistance: 37, features: { reach: { sampleCount: 12, coverage: 0.375, unit: "torso_length_ratio", medianDeviation: 0.2, maximumDeviation: null, colorCounts: {} } }, frames: [{ timeSeconds: 1, referenceTimeSeconds: 0.7, phase: null, features: { reach: { value: null, referenceValue: 0.8, deviation: null, unit: "torso_length_ratio", color: null, reason: "joint_not_observable" } }, joints: { elbow: { value: 90, referenceValue: 80, deviation: 10, unit: "deg", color: "yellow", reason: null, landmarkIndices: [11,13,15], feedbackCode: "lebih_menekuk_dari_referensi" } } }] };
  const html = renderToStaticMarkup(createElement(CoachComparisonPanel, { comparison }));
  expect(html).toContain("Perbandingan referensi selesai"); expect(html).toContain("12 sampel"); expect(html).toContain("37.5%"); expect(html).toContain("rasio panjang torso"); expect(html).toContain("Tidak terukur"); expect(html).toContain("Lebih menekuk"); expect(html).not.toContain("37%"); expect(html).not.toContain("sentimeter"); expect(html).not.toContain("shoulder_width");
 });
 it("does not replace static measurements when comparison is absent", () => { expect(renderToStaticMarkup(createElement(CoachComparisonPanel, {}))).toBe(""); });
});
