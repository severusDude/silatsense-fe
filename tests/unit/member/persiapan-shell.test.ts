import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

describe("persiapan components", () => {
  it("layers viewfinder badges over the placeholder without absolute", () => {
    // Arrange + Act
    const src = read("features/member/components/persiapan-viewport.tsx");

    // Assert
    expect(src).not.toContain("absolute");
    expect(src).toContain("ImagePlaceholder");
    expect(src).toContain("col-start-1 row-start-1");
    expect(src).toContain("1080p @ 60 FPS");
    expect(src).toContain("Pesilat Terdeteksi");
    expect(src).toContain("Ganti");
    expect(src).toContain("TODO");
  });

  it("keeps all persiapan sections flex-only with lucide icons", () => {
    // Arrange + Act
    const files = [
      "features/member/components/persiapan-viewport.tsx",
      "features/member/components/camera-source-card.tsx",
      "features/member/components/coach-instruction-card.tsx",
      "features/member/components/calibration-card.tsx",
      "features/member/components/persiapan-cta.tsx",
    ];

    // Assert
    for (const file of files) {
      const src = read(file);
      expect(src).not.toContain("absolute");
      expect(src).toContain("lucide-react");
    }
  });

  it("renders camera, coach, and calibration copy verbatim", () => {
    // Arrange + Act
    const source = read("features/member/components/camera-source-card.tsx");
    const coach = read("features/member/components/coach-instruction-card.tsx");
    const calibration = read("features/member/components/calibration-card.tsx");

    // Assert
    expect(source).toContain("PILIH SUMBER KAMERA");
    expect(source).toContain("Pindai Ulang");
    expect(source).toContain("Logitech Brio 4K Ultra HD");
    expect(source).toContain("Terhubung (1080p @ 60 FPS)");
    expect(coach).toContain("INSTRUKSI PELATIH SILAT");
    expect(coach).toContain("Wajib");
    expect(calibration).toContain("KESIAPAN SENSOR & AI");
    expect(calibration).toContain("readinessLabel");
    expect(calibration).toContain("PANDUAN POSTUR KUNCI");
  });

  it("keeps the CTA dead with a session TODO and no countdown state", () => {
    // Arrange + Act
    const src = read("features/member/components/persiapan-cta.tsx");

    // Assert
    expect(src).toContain("Mulai Analisis Gerakan");
    expect(src).toContain("3s Mundur");
    expect(src).toContain("aria-disabled");
    expect(src).toContain("TODO");
    expect(src).toContain("/latihan/[slug]/sesi");
    expect(src).not.toContain("useState");
  });
});

describe("persiapan route", () => {
  it("keeps the [slug] route thin with static params and no client boundary", () => {
    // Arrange + Act
    const layout = read("app/(member)/latihan/[slug]/layout.tsx");
    const page = read("app/(member)/latihan/[slug]/page.tsx");

    // Assert
    expect(layout).not.toContain("use client");
    expect(page).not.toContain("use client");
    expect(page).toContain("generateStaticParams");
    expect(page).toContain("persiapanSlugs");
    expect(page).toContain("@/features/member/pages/persiapan-page");
    expect(page).toContain("PersiapanPage");
  });

  it("suspends five sections behind skeleton fallbacks with a notFound guard", () => {
    // Arrange + Act
    const src = read("features/member/pages/persiapan-page.tsx");

    // Assert
    expect(src).toContain("Suspense");
    expect(src).toContain("Skeleton");
    expect(src).toContain("notFound");
    expect(src).toContain("getPersiapan");
    expect(src).toContain("PersiapanViewport");
    expect(src).toContain("CameraSourceCard");
    expect(src).toContain("CoachInstructionCard");
    expect(src).toContain("CalibrationCard");
    expect(src).toContain("PersiapanCta");
  });

  it("owns one member shell per leaf without double chrome", () => {
    // Arrange + Act
    const group = read("app/(member)/latihan/layout.tsx");
    const list = read("app/(member)/latihan/(list)/layout.tsx");
    const detail = read("app/(member)/latihan/[slug]/layout.tsx");

    // Assert
    expect(group).not.toContain("MemberLayout");
    expect(list).toContain("MemberLayout");
    expect(list).toContain('activeTab="latihan"');
    expect(detail).toContain("MemberLayout");
    expect(detail).toContain('activeTab="latihan"');
    expect(detail).toContain("Persiapan Latihan");
  });

  it("links module cards to the persiapan route", () => {
    // Arrange + Act
    const src = read("features/member/components/module-card.tsx");

    // Assert
    expect(src).toContain("/latihan/${module.slug}");
    expect(src).not.toContain("aria-disabled");
  });
});
