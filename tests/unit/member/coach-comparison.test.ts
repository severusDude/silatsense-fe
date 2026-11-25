import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, it, expect } from "vitest";
import { CoachComparisonDetails } from "@/features/member/components/coach-comparison";
import { EvaluasiPostureList } from "@/features/member/components/evaluasi-posture-list";
import { EvaluasiScoreCard } from "@/features/member/components/evaluasi-score-card";
import type { EvaluationScoreViewModel } from "@/features/member/types";
import type { CoachComparison, PostureAssessment } from "@/api";
import { zCoachComparison } from "@/api/zod.gen";

function renderAssessment(postureAssessment?: PostureAssessment | null) {
  const comparison = zCoachComparison.parse({
    movementId: "tangkisan_bawah", status: "compared", toleranceStatus: "ready",
    features: {}, frames: [], postureAssessment,
  });
  const score: EvaluationScoreViewModel = {
    available: false, value: null, unitLabel: "poin", max: 100, status: "reference_compared",
    statusLabel: "Perbandingan referensi selesai", reason: null, variantLabel: null,
    summary: "Skor keseluruhan gerakan belum tervalidasi.",
  };
  const evaluation = { coachComparison: comparison, postures: [], score };
  return {
    score: renderToStaticMarkup(createElement(EvaluasiScoreCard, { evaluation })),
    posture: renderToStaticMarkup(createElement(EvaluasiPostureList, { evaluation })),
  };
}

const elbow = {
  id: "elbow_bend", unit: "deg", points: 85,
  correctionCode: "elbow_bend_insufficient", reason: null,
} as const;
const unavailable = {
  id: "wrist_end_position", unit: "torso_length_ratio", points: null,
  correctionCode: null, reason: "camera_or_pose_inadequate",
} as const;

describe("temporal comparison presentation", () => {
 it("renders null measurements, torso ratios, sample coverage and feedback without fabricating a score", () => {
  const comparison: CoachComparison = { movementId: "pukulan_bandul", status: "compared", toleranceStatus: "ready", alignmentDistance: 37, features: { reach: { sampleCount: 12, coverage: 0.375, unit: "torso_length_ratio", medianDeviation: 0.2, maximumDeviation: null, colorCounts: {} } }, frames: [{ timeSeconds: 1, referenceTimeSeconds: 0.7, phase: null, features: { reach: { value: null, referenceValue: 0.8, deviation: null, unit: "torso_length_ratio", color: null, reason: "joint_not_observable" } }, joints: { elbow: { value: 90, referenceValue: 80, deviation: 10, unit: "deg", color: "yellow", reason: null, landmarkIndices: [11,13,15], feedbackCode: "lebih_menekuk_dari_referensi" } } }] };
  const html = renderToStaticMarkup(createElement(CoachComparisonDetails, { comparison }));
  expect(html).toContain("Perbandingan referensi selesai"); expect(html).toContain("12 sampel"); expect(html).toContain("37.5%"); expect(html).toContain("rasio panjang torso"); expect(html).toContain("Tidak terukur"); expect(html).toContain("Lebih menekuk"); expect(html).not.toContain("37%"); expect(html).not.toContain("sentimeter"); expect(html).not.toContain("shoulder_width");
 });
 it("omits reference details when comparison is absent", () => { expect(renderToStaticMarkup(createElement(CoachComparisonDetails, {}))).toBe(""); });
 it("puts the backend total in the score card and aspects in the posture card", () => {
  const { score, posture } = renderAssessment({
    status: "assessed", points: 42.5, maxPoints: 100, reason: null,
    aspects: [elbow, { ...unavailable, points: 0, reason: null }],
  });
  expect(score).toContain("Skor Kemiripan");
  expect(score).toContain("Poin postur eksperimental");
  expect(score).toContain("42,5<span");
  expect(score).not.toContain("Tekukan siku");
  expect(posture).toContain("Penilaian Postur");
  expect(posture).toContain("Penilaian selesai");
  expect(posture).toContain(">0/100 poin<");
  expect(posture).toContain("85/100 poin");
  expect(posture).toContain("Tekukan siku");
  expect(posture).toContain("Siku kurang menekuk dibanding referensi Coach.");
  expect(posture).toContain("Detail pengukuran");
  expect(posture).not.toContain("Perbandingan referensi AI");
  expect(posture).not.toContain("Belum ada parameter postur");
  expect(posture).not.toContain("42,5");
 });
 it("explains a partial assessment and shows only the available aspect points", () => {
  const { score, posture: html } = renderAssessment({
    status: "partial", points: null, reason: "required_aspect_unavailable", aspects: [elbow, unavailable],
  });
  expect(html).toContain("Dinilai sebagian");
  expect(html).toContain("Sebagian atau seluruh aspek utama belum dapat dinilai.");
  expect(html).toContain("Belum dapat dinilai");
  expect(html).toContain("Pose atau sudut kamera belum cukup jelas untuk dinilai.");
  expect(html.match(/\/100 poin/g)).toEqual(["/100 poin"]);
  expect(score).toContain("Total belum dapat dinilai.");
  expect(score).not.toContain("/100 poin");
 });
 it("withholds all points when the posture cannot be assessed", () => {
  const { posture: html } = renderAssessment({
    status: "not_assessable", points: null, reason: "comparison_not_assessable", aspects: [unavailable],
  });
  expect(html).toContain("Belum dapat dinilai");
  expect(html).toContain("Perbandingan dengan referensi Coach belum bisa digunakan.");
  expect(html).not.toContain("/100 poin");
 });
 it("keeps the existing comparison visible when an older backend omits posture assessment", () => {
  for (const assessment of [undefined, null]) {
    const { score, posture } = renderAssessment(assessment);
    expect(score).not.toContain("Poin postur eksperimental");
    expect(posture).toContain("Perbandingan referensi selesai");
  }
 });
});
