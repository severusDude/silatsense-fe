import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

describe("rekam components", () => {
  it("layers the duration badge and camera select over the placeholder without absolute", () => {
    // Arrange + Act
    const src = read("features/member/components/rekam-viewport.tsx");

    // Assert
    expect(src).not.toContain("absolute");
    expect(src).toContain("ImagePlaceholder");
    expect(src).toContain("col-start-1 row-start-1");
    expect(src).toContain("aspect-[3/4]");
    expect(src).toContain("qualityLabel");
    expect(src).toContain("Siaga");
    expect(src).toContain("formatClock");
    expect(src).toContain("targetDurationSec");
    expect(src).toContain("maxDurationSec");
    expect(src).toContain("<video");
    expect(src).not.toContain("Ganti");
    expect(src).not.toContain("Pesilat Terdeteksi");
    expect(src).not.toContain("COG 50:50");
  });

  it("selects cameras through a badge-styled shadcn select", () => {
    // Arrange + Act
    const src = read("features/member/components/rekam-viewport.tsx");

    // Assert
    expect(src).toContain("lucide-react");
    expect(src).toContain("items={");
    expect(src).toContain("onValueChange");
    expect(src).toContain("SelectTrigger");
    expect(src).toContain("bg-background/80");
    expect(src).toContain("backdrop-blur-sm");
    expect(src).toContain('aria-label="Pilih kamera"');
  });

  it("probes the live stream on interaction with no fake mount timer", () => {
    // Arrange + Act
    const src = read("features/member/components/rekam-viewport.tsx");

    // Assert
    expect(src).toContain("getUserMedia");
    expect(src).toContain("getTracks");
    expect(src).toContain("enumerateDevices");
    expect(src).toContain("denied");
    expect(src).toContain("TODO");
    expect(src).toContain("MediaRecorder");
    expect(src).not.toContain("setInterval");
  });

  it("removes the fake Selesai CTA until recording controls land", () => {
    // Arrange + Act
    const page = read("features/member/pages/rekam-page.tsx");

    // Assert
    expect(page).not.toContain("RekamSelesaiCta");
    expect(page).not.toContain("/latihan/${detail.slug}/sesi");
    expect(() => read("features/member/components/rekam-selesai-cta.tsx")).toThrow();
  });

  it("links the persiapan CTA to the rekam route", () => {
    // Arrange + Act
    const src = read("features/member/components/persiapan-cta.tsx");

    // Assert
    expect(src).toContain("/latihan/${slug}/rekam");
    expect(src).toContain("Mulai Analisis Gerakan");
    expect(src).not.toContain("aria-disabled");
    expect(src).not.toContain("/latihan/[slug]/sesi");
  });
});

describe("rekam route", () => {
  it("keeps the rekam route thin without static params or a client boundary", () => {
    // Arrange + Act
    const layout = read("app/(member)/latihan/[slug]/rekam/layout.tsx");
    const page = read("app/(member)/latihan/[slug]/rekam/page.tsx");

    // Assert
    expect(layout).not.toContain("use client");
    expect(page).not.toContain("use client");
    expect(page).not.toContain("generateStaticParams");
    expect(page).not.toContain("rekamSlugs");
    expect(page).toContain("@/features/member/pages/rekam-page");
    expect(page).toContain("RekamPage");
  });

  it("reads the record config once and hands it to the client viewport", () => {
    // Arrange + Act
    const src = read("features/member/pages/rekam-page.tsx");

    // Assert
    expect(src).toContain("Suspense");
    expect(src).toContain("Skeleton");
    expect(src).toContain("notFound");
    expect(src).toContain("getRekam");
    expect(src.match(/getRekam\(/g)).toHaveLength(1);
    expect(src).not.toContain("getCameras");
    expect(src).not.toContain("defaultCameraId");
    expect(src).toContain("RekamViewport");
    expect(src).not.toContain("RekamSelesaiCta");
  });

  it("owns one member shell per leaf without double chrome", () => {
    // Arrange + Act
    const slug = read("app/(member)/latihan/[slug]/layout.tsx");
    const detail = read("app/(member)/latihan/[slug]/rekam/layout.tsx");

    // Assert
    expect(slug).not.toContain("MemberLayout");
    expect(detail).toContain("MemberLayout");
    expect(detail).toContain('activeTab="latihan"');
    expect(detail).toContain("Mulai Latihan");
  });
});
