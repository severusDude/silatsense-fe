import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, it, expect } from "vitest";
import { CoachComparisonPanel } from "@/features/member/components/coach-comparison";
import type { CoachComparison } from "@/api";

function sideStance(samples: Array<[number | null, number | null, number]>) {
  const feature = (value: number | null, unit: "deg" | "torso_length_ratio") => ({
    value, unit, referenceValue: null, deviation: null, color: null, reason: null,
  });
  const comparison: CoachComparison = {
    movementId: "kuda_kuda_samping", status: "compared", toleranceStatus: "ready",
    features: {},
    frames: samples.map(([left, right, width], index) => ({
      timeSeconds: index / 10, referenceTimeSeconds: index / 10, phase: null, joints: {},
      features: {
        left_knee_deg: feature(left, "deg"),
        right_knee_deg: feature(right, "deg"),
        stance_width_torso: feature(width, "torso_length_ratio"),
      },
    })),
  };
  return renderToStaticMarkup(createElement(CoachComparisonPanel, { comparison }));
}

describe("temporal comparison presentation", () => {
 it("renders null measurements, torso ratios, sample coverage and feedback without fabricating a score", () => {
  const comparison: CoachComparison = { movementId: "pukulan_bandul", status: "compared", toleranceStatus: "ready", alignmentDistance: 37, features: { reach: { sampleCount: 12, coverage: 0.375, unit: "torso_length_ratio", medianDeviation: 0.2, maximumDeviation: null, colorCounts: {} } }, frames: [{ timeSeconds: 1, referenceTimeSeconds: 0.7, phase: null, features: { reach: { value: null, referenceValue: 0.8, deviation: null, unit: "torso_length_ratio", color: null, reason: "joint_not_observable" } }, joints: { elbow: { value: 90, referenceValue: 80, deviation: 10, unit: "deg", color: "yellow", reason: null, landmarkIndices: [11,13,15], feedbackCode: "lebih_menekuk_dari_referensi" } } }] };
  const html = renderToStaticMarkup(createElement(CoachComparisonPanel, { comparison }));
  expect(html).toContain("Perbandingan referensi selesai"); expect(html).toContain("12 sampel"); expect(html).toContain("37.5%"); expect(html).toContain("rasio panjang torso"); expect(html).toContain("Tidak terukur"); expect(html).toContain("Lebih menekuk"); expect(html).not.toContain("37%"); expect(html).not.toContain("sentimeter"); expect(html).not.toContain("shoulder_width");
 });
 it("does not replace static measurements when comparison is absent", () => { expect(renderToStaticMarkup(createElement(CoachComparisonPanel, {}))).toBe(""); });
 it("gives the reference stance full knee points without a correction", () => {
  const html = sideStance([[178, 178, 0.3], [132, 104, 1.93], [133, 110, 2], [134, 110, 1.99]]);
  expect(html).toContain("100/100 poin");
  expect(html).not.toContain("Tekuk sedikit lagi");
 });
 it("gives fewer points and a correction when the opposite knee bends too little", () => {
  const html = sideStance([[137, 146, 1.35], [137, 143, 1.36], [137, 146, 1.43], [135, 145, 1.43]]);
  expect(html).toContain("83/100 poin");
  expect(html).toContain("Tekuk sedikit lagi lutut");
 });
 it("withholds points when pose data is missing or the stance is not visible", () => {
  expect(sideStance([[110, 150, 1.5], [null, 150, 1.5], [110, 150, 1.5]])).toContain("belum bisa dinilai");
  expect(sideStance([[110, 150, 0.4], [110, 150, 0.4], [110, 150, 0.4]])).not.toContain("/100 poin");
 });
});
