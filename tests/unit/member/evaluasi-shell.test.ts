import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

describe("evaluasi components", () => {
  it("renders the video placeholder shell with two TODOs and no overlays", () => {
    // Arrange + Act
    const src = read("features/member/components/evaluasi-playback.tsx");

    // Assert
    expect(src).not.toContain("absolute");
    expect(src).toContain("aspect-[4/3]");
    expect(src).toContain("<video");
    expect(src).toContain("controls");
    expect(src).not.toContain("src=");
    expect(src).toContain(
      "TODO: bind recorded blob via lib/api-client.ts (GET /member/evaluations/:slug/video)",
    );
    expect(src).toContain("TODO(spike)");
    expect(src).toContain("vplayer-react");
    expect(src).not.toContain("4.18");
  });

  it("uses shadcn Badge for all six pill slots with no speed badge", () => {
    // Arrange + Act — components bind pill slots dynamically (Tasks 2–4 briefs);
    // the literal pill strings live in the dummy fixture (Task 1 brief).
    const files = [
      "features/member/components/evaluasi-header.tsx",
      "features/member/components/evaluasi-score-card.tsx",
      "features/member/components/evaluasi-playback.tsx",
      "features/member/components/evaluasi-posture-list.tsx",
      "features/member/components/evaluasi-posture-item.tsx",
    ];
    const src = files.map(read).join("\n");
    const data = read("features/member/data/evaluasi-dummy.ts");

    // Assert
    expect(src).toContain("@/components/ui/badge");
    expect(src).toContain("Repetisi Sah");
    expect(src).toContain("Terdeviasi");
    expect(src).toContain("alertLabel");
    expect(src).toContain("qualityLabel");
    expect(src).toContain("statusLabel");
    expect(data).toContain("validReps: 12");
    expect(data).toContain("deviatedReps: 3");
    expect(data).toContain("PERLU PERBAIKAN");
    expect(data).toContain("1080p@60FPS");
    expect(data).toContain("SESUAI");
    expect(data).toContain("PERLU KOREKSI");
    expect(src).not.toContain("4.18");
    expect(src).not.toContain("speedLabel");
  });

  it("keeps all evaluasi UI flex-only with lucide icons", () => {
    // Arrange + Act
    const files = [
      "features/member/components/evaluasi-header.tsx",
      "features/member/components/evaluasi-score-card.tsx",
      "features/member/components/evaluasi-playback.tsx",
      "features/member/components/evaluasi-scrubber.tsx",
      "features/member/components/evaluasi-posture-list.tsx",
      "features/member/components/evaluasi-posture-item.tsx",
      "features/member/components/evaluasi-pose-thumb.tsx",
      "features/member/components/evaluasi-actions.tsx",
    ];

    // Assert — ScoreRing centers its label via one sanctioned
    // `absolute inset-0` span inside a relative ring; no other overlays allowed.
    for (const file of files) {
      expect(read(file).replace("absolute inset-0", "")).not.toContain(
        "absolute",
      );
    }
    expect(
      read("features/member/components/evaluasi-score-card.tsx"),
    ).toContain("lucide-react");
  });

  it("links Latihan Ulang to rekam and keeps Selesai dead with a TODO", () => {
    // Arrange + Act
    const src = read("features/member/components/evaluasi-actions.tsx");

    // Assert
    expect(src).toContain("Selesai dan Simpan");
    expect(src).toContain("/latihan/${session.slug}/rekam");
    expect(src).toContain("Latihan Ulang");
    expect(src).toContain("POST /member/evaluations/:slug/ack");
    expect(src).toContain("TODO");
  });
});

describe("evaluasi card shells", () => {
  it("wraps visualisasi, penilaian, and actions each in a Card", () => {
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
      expect(src).toContain("<CardContent");
    }
  });

  it("bleeds the video full-width against the card padding", () => {
    // Arrange + Act
    const src = read("features/member/components/evaluasi-playback.tsx");

    // Assert
    expect(src).toContain("-mx-4");
    expect(src).toContain("min-w-[calc(100%_+_2rem)]");
    expect(src).toContain("aspect-[4/3]");
    expect(src).toContain("<video");
    expect(src).not.toContain("absolute");
  });

  it("revamps posture rows with ring, sorted Collapsible rows, and thumb stub", () => {
    // Arrange + Act
    const src = [
      "features/member/components/evaluasi-posture-list.tsx",
      "features/member/components/evaluasi-posture-item.tsx",
      "features/member/components/evaluasi-pose-thumb.tsx",
    ]
      .map(read)
      .join("\n");
    const data = read("features/member/data/evaluasi-dummy.ts");

    // Assert
    expect(src).toContain("Collapsible");
    expect(src).toContain("min-h-[64px]");
    expect(data).toContain("PERLU KOREKSI");
    expect(data).toContain("142° → target 130–138°");
    expect(data).toContain("Tarik siku");
    expect(src).toContain("strokeDasharray");
    expect(src).toContain("CardHeader");
    expect(src).not.toContain("TIDAK SESUAI");
    expect(src).not.toContain("PERLU PERBAIKAN");
  });
});

describe("evaluasi route", () => {
  it("keeps the evaluasi route thin with static params and no client boundary", () => {
    // Arrange + Act
    const layout = read("app/(member)/latihan/[slug]/evaluasi/layout.tsx");
    const page = read("app/(member)/latihan/[slug]/evaluasi/page.tsx");

    // Assert
    expect(layout).not.toContain("use client");
    expect(page).not.toContain("use client");
    expect(page).toContain("generateStaticParams");
    expect(page).toContain("evaluasiSlugs");
    expect(page).toContain("@/features/member/pages/evaluasi-page");
    expect(page).toContain("EvaluasiPage");
  });

  it("suspends four units behind skeleton fallbacks", () => {
    // Arrange + Act
    const src = read("features/member/pages/evaluasi-page.tsx");

    // Assert
    expect(src).toContain("Suspense");
    expect(src).toContain("Skeleton");
    expect(src).toContain("notFound");
    expect(src).toContain("getEvaluasi");
    expect(src).toContain("EvaluasiHeader");
    expect(src).toContain("EvaluasiScoreCard");
    expect(src).toContain("EvaluasiPlayback");
    expect(src).toContain("EvaluasiPostureList");
    expect(src).toContain("EvaluasiActions session");
    expect(src.match(/Suspense/g)?.length).toBeGreaterThanOrEqual(4);
  });

  it("owns one member shell per leaf with the Evaluasi trail", () => {
    // Arrange + Act
    const slug = read("app/(member)/latihan/[slug]/layout.tsx");
    const detail = read("app/(member)/latihan/[slug]/evaluasi/layout.tsx");

    // Assert
    expect(slug).not.toContain("MemberLayout");
    expect(detail).toContain("MemberLayout");
    expect(detail).toContain('activeTab="latihan"');
    expect(detail).toContain("Evaluasi");
  });

  it("links the sesi Lihat Evaluasi affordance live to the evaluasi route", () => {
    // Arrange + Act
    const src = read("features/member/components/sesi-actions.tsx");

    // Assert
    expect(src).toContain("Lihat Evaluasi");
    expect(src).toContain("/latihan/${session.slug}/evaluasi");
    expect(src).toContain("Link");
  });
});
