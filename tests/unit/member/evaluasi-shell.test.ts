import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

describe("evaluasi components", () => {
  it("streams the real recording with the media metadata badge", () => {
    // Arrange + Act
    const src = read("features/member/components/evaluasi-playback.tsx");

    // Assert
    expect(src).not.toContain("absolute");
    expect(src).toContain("aspect-[4/3]");
    expect(src).toContain("<video");
    expect(src).toContain("controls");
    expect(src).toContain("/api/member/sessions/${evaluation.sessionId}/video");
    expect(src).toContain("MediaUnavailable");
    expect(src).toContain("mediaMetaLabel");
    expect(src).not.toContain("EvaluasiScrubber");
    expect(src).not.toContain("1080p@60FPS");
    expect(src).not.toContain("Frame 245");
  });

  it("removes repetition badges and keeps the inactive repetition note", () => {
    // Arrange + Act
    const src = read("features/member/components/evaluasi-header.tsx");

    // Assert
    expect(src).not.toContain("Repetisi Sah");
    expect(src).not.toContain("Terdeviasi");
    expect(src).not.toContain("validReps");
    expect(src).toContain("Repetisi segera hadir");
    expect(src).toContain("postureQualityLabel");
    expect(src).toContain("lucide-react");
  });

  it("shows similarity points with no percentage target or delta", () => {
    // Arrange + Act
    const src = read("features/member/components/evaluasi-score-card.tsx");

    // Assert
    expect(src).toContain("Skor Kemiripan");
    expect(src).toContain("unitLabel");
    expect(src).toContain("formatScore");
    expect(src).not.toContain("Akurasi");
    expect(src).not.toContain("targetPct");
    expect(src).not.toContain("targetLabel");
    expect(src).not.toContain("deltaLabel");
    expect(src).not.toContain("≥ 85");
    expect(src).toContain("belum tersedia");
    expect(src).toContain("variantLabel");
  });

  it("renders a dynamic posture count with three assessment states", () => {
    // Arrange + Act
    const list = read("features/member/components/evaluasi-posture-list.tsx");
    const item = read("features/member/components/evaluasi-posture-item.tsx");

    // Assert
    expect(list).toContain("postures.length");
    expect(list).not.toContain("5 parameter");
    expect(list).not.toContain("pukulan lurus");
    expect(list).toContain("STATUS_ORDER");
    expect(list).toContain("Belum ada parameter postur");
    expect(item).toContain("tidak-dinilai");
    expect(item).toContain("CircleDashed");
    expect(item).toContain("perlu-koreksi");
    expect(item).toContain("sesuai");
    expect(item).toContain("correctionCue");
    expect(item).not.toContain("TIDAK SESUAI");
    expect(item).not.toContain("PERLU PERBAIKAN");
  });

  it("keeps all evaluasi UI flex-only with lucide icons", () => {
    // Arrange + Act
    const files = [
      "features/member/components/evaluasi-header.tsx",
      "features/member/components/evaluasi-score-card.tsx",
      "features/member/components/evaluasi-playback.tsx",
      "features/member/components/evaluasi-posture-list.tsx",
      "features/member/components/evaluasi-posture-item.tsx",
      "features/member/components/evaluasi-pose-thumb.tsx",
      "features/member/components/evaluasi-actions.tsx",
    ];

    // Assert
    for (const file of files) {
      expect(read(file)).not.toContain("absolute");
    }
    expect(
      read("features/member/components/evaluasi-posture-item.tsx"),
    ).toContain("lucide-react");
  });

  it("links retake to rekam and back to the session-keyed review", () => {
    // Arrange + Act
    const src = read("features/member/components/evaluasi-actions.tsx");

    // Assert
    expect(src).toContain("use client");
    expect(src).toContain("Latihan Ulang");
    expect(src).toContain("/latihan/${evaluation.slug}/rekam");
    expect(src).toContain("/latihan/${evaluation.slug}/sesi/${evaluation.sessionId}");
    expect(src).toContain("Kembali ke Sesi");
    expect(src).not.toContain("≥ 85");
  });

  it("acknowledges the evaluation through the real server action", () => {
    // Arrange + Act
    const src = read("features/member/components/evaluasi-actions.tsx");

    // Assert
    expect(src).toContain("acknowledgeSessionAction");
    expect(src).toContain("{ sessionId: evaluation.sessionId }");
    expect(src).toContain("Selesai dan Simpan");
    expect(src).toContain("disabled={acknowledgeMutation.isPending}");
    expect(src).toContain("evaluation.acknowledged");
    expect(src).toContain("evaluation.acknowledgedAtLabel");
    expect(src).toContain("router.refresh()");
    expect(src).toContain('role="alert"');
  });
});

describe("evaluasi card shells", () => {
  it("wraps playback, posture list, and actions each in a Card", () => {
    // Arrange + Act
    const files = [
      "features/member/components/evaluasi-playback.tsx",
      "features/member/components/evaluasi-posture-list.tsx",
      "features/member/components/evaluasi-actions.tsx",
    ];

    // Assert
    for (const file of files) {
      const src = read(file);
      expect(src).toContain("@/components/ui/card");
      expect(src).toContain("<Card>");
    }
    expect(
      read("features/member/components/evaluasi-playback.tsx"),
    ).toContain("<CardContent");
    expect(
      read("features/member/components/evaluasi-posture-list.tsx"),
    ).toContain("<CardContent");
    expect(
      read("features/member/components/evaluasi-actions.tsx"),
    ).toContain("<CardFooter");
  });

  it("bleeds the video full-width against the card padding", () => {
    // Arrange + Act
    const src = read("features/member/components/evaluasi-playback.tsx");

    // Assert
    expect(src).toContain("-mx-6");
    expect(src).toContain("min-w-[calc(100%_+_3rem)]");
    expect(src).toContain("aspect-[4/3]");
    expect(src).toContain("<video");
    expect(src).not.toContain("absolute");
  });

  it("composes CardHeader/CardFooter slots on score, playback, and actions", () => {
    // Arrange + Act
    const score = read("features/member/components/evaluasi-score-card.tsx");
    const playback = read("features/member/components/evaluasi-playback.tsx");
    const actions = read("features/member/components/evaluasi-actions.tsx");

    // Assert
    expect(score).toContain("CardHeader");
    expect(score).toContain("CardTitle");
    expect(score).toContain("CardAction");
    expect(playback).toContain("CardHeader");
    expect(playback).toContain("CardTitle");
    expect(playback).toContain("CardAction");
    expect(actions).toContain("CardHeader");
    expect(actions).toContain("CardDescription");
    expect(actions).toContain("CardFooter");
  });

  it("keeps the ring and collapsible rows with a thumb placeholder", () => {
    // Arrange + Act
    const src = [
      "features/member/components/evaluasi-posture-list.tsx",
      "features/member/components/evaluasi-posture-item.tsx",
      "features/member/components/evaluasi-pose-thumb.tsx",
    ]
      .map(read)
      .join("\n");

    // Assert
    expect(src).toContain("Collapsible");
    expect(src).toContain("min-h-[64px]");
    expect(src).toContain("strokeDasharray");
    expect(src).toContain("Pratinjau visual segera hadir");
    expect(src).not.toContain("/pose/:id");
  });
});

describe("evaluasi route", () => {
  it("keeps the evaluation route thin and keyed by sessionId", () => {
    // Arrange + Act
    const layout = read(
      "app/(member)/latihan/[slug]/evaluasi/[sessionId]/layout.tsx",
    );
    const page = read(
      "app/(member)/latihan/[slug]/evaluasi/[sessionId]/page.tsx",
    );

    // Assert
    expect(layout).not.toContain("use client");
    expect(page).not.toContain("use client");
    expect(page).not.toContain("generateStaticParams");
    expect(page).toContain("sessionId");
    expect(page).toContain("@/features/member/pages/evaluasi-page");
    expect(page).toContain("EvaluasiPage");
    expect(page).toContain("params={params}");
    expect(page).not.toContain("await params");
  });

  it("reads the evaluation once and rejects a mismatched movement slug", () => {
    // Arrange + Act
    const src = read("features/member/pages/evaluasi-page.tsx");

    // Assert
    expect(src).toContain("Suspense");
    expect(src).toContain("Skeleton");
    expect(src).toContain("notFound");
    expect(src).toContain("getEvaluation");
    expect(src.match(/getEvaluation\(/g)).toHaveLength(1);
    expect(src).toContain("isTrainingModuleSlug");
    expect(src).toContain("evaluation.slug !== slug");
    expect(src).toContain("EvaluasiHeader");
    expect(src).toContain("EvaluasiScoreCard");
    expect(src).toContain("EvaluasiPlayback");
    expect(src).toContain("EvaluasiPostureList");
    expect(src).toContain("EvaluasiActions");
  });

  it("owns one member shell per leaf with the Evaluasi trail", () => {
    // Arrange + Act
    const slug = read("app/(member)/latihan/[slug]/layout.tsx");
    const detail = read(
      "app/(member)/latihan/[slug]/evaluasi/[sessionId]/layout.tsx",
    );

    // Assert
    expect(slug).not.toContain("MemberLayout");
    expect(detail).toContain("MemberLayout");
    expect(detail).toContain('activeTab="latihan"');
    expect(detail).toContain("Evaluasi");
  });

  it("removes the old slug-only routes and dummy reader", () => {
    // Arrange + Act
    const oldFiles = [
      "app/(member)/latihan/[slug]/evaluasi/page.tsx",
      "app/(member)/latihan/[slug]/evaluasi/layout.tsx",
      "features/member/data/get-evaluasi.ts",
      "features/member/data/evaluasi-dummy.ts",
      "features/member/components/evaluasi-scrubber.tsx",
    ];

    // Assert
    for (const file of oldFiles) {
      expect(() => read(file)).toThrow();
    }
  });
});
