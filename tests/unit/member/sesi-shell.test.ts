import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

describe("sesi components", () => {
  it("plays the recording in a portrait frame without overlay chrome", () => {
    // Arrange + Act
    const src = read("features/member/components/sesi-playback.tsx");

    // Assert
    expect(src).not.toContain("absolute");
    expect(src).toContain("ImagePlaceholder");
    expect(src).toContain("aspect-[3/4]");
    expect(src).toContain("<video");
    expect(src).toContain("controls");
    expect(src).not.toContain("ULASAN SESI");
    expect(src).not.toContain("00:47");
    expect(src).not.toContain("Hasil rekaman");
    expect(src).not.toContain("durationLabel");
    expect(src).not.toContain("Ganti");
    expect(src).not.toContain("Pesilat Terdeteksi");
    expect(src).not.toContain("COG 50:50");
  });

  it("renders the 7-row recording info card without absolute", () => {
    // Arrange + Act
    const src = read("features/member/components/sesi-info-card.tsx");

    // Assert
    expect(src).not.toContain("absolute");
    expect(src).toContain("Latihan");
    expect(src).toContain("Durasi");
    expect(src).toContain("Direkam");
    expect(src).toContain("Ukuran berkas");
    expect(src).toContain("Kamera");
    expect(src).toContain("Resolusi");
    expect(src).toContain("FPS");
    expect(src).toContain("eyebrow");
  });

  it("renders the upload as an attachment card with bottom progress", () => {
    // Arrange + Act
    const src = read("features/member/components/sesi-actions.tsx");

    // Assert
    expect(src).toContain("use client");
    expect(src).toContain("Attachment");
    expect(src).toContain("AttachmentMedia");
    expect(src).toContain("AttachmentContent");
    expect(src).toContain("AttachmentTitle");
    expect(src).toContain("AttachmentDescription");
    expect(src).toContain("FileVideo");
    expect(src).toContain('"uploading"');
    expect(src).toContain('"error"');
    expect(src).toContain('"done"');
    expect(src).toContain('role="progressbar"');
    expect(src).toContain("aria-valuenow");
    expect(src).toContain("basis-full");
    expect(src).not.toContain("absolute");
  });

  it("drives a fail-once-at-72 upload machine with retry", () => {
    // Arrange + Act
    const src = read("features/member/components/sesi-actions.tsx");

    // Assert
    expect(src).toContain("Unggah Rekaman");
    expect(src).toContain("%");
    expect(src).toContain("72");
    expect(src).toContain("Coba lagi");
    expect(src).toContain("Terunggah");
    expect(src).toContain("toast");
    expect(src).toContain("clearInterval");
  });

  it("keeps Coba lagi and Lihat Evaluasi primary above the retake", () => {
    // Arrange + Act
    const src = read("features/member/components/sesi-actions.tsx");

    // Assert
    expect(src).toContain("Lihat Evaluasi");
    expect(src).toContain(
      'buttonVariants({ size: "lg", className: "w-full rounded-full" })',
    );
    const evaluasiIndex = src.indexOf("Lihat Evaluasi");
    const retakeIndex = src.indexOf("/latihan/${session.slug}/rekam");
    expect(evaluasiIndex).toBeGreaterThan(-1);
    expect(retakeIndex).toBeGreaterThan(evaluasiIndex);
  });

  it("pins the XHR upload contract and dead evaluasi affordance", () => {
    // Arrange + Act
    const src = read("features/member/components/sesi-actions.tsx");

    // Assert
    expect(src).toContain("XHR");
    expect(src).toContain("lib/api-client.ts");
    expect(src).toContain("POST /member/sessions");
    expect(src).toContain("Lihat Evaluasi");
    expect(src).toContain("/evaluasi");
    expect(src).toContain("TODO");
    expect(src).toContain("lucide-react");
  });

  it("guards the retake link while uploading", () => {
    // Arrange + Act
    const src = read("features/member/components/sesi-actions.tsx");

    // Assert
    expect(src).toContain("/latihan/${session.slug}/rekam");
    expect(src).toContain("Hapus & Latihan Ulang");
    expect(src).toContain("aria-disabled");
    expect(src).toContain("preventDefault");
  });

  it("keeps all sesi UI flex-only with lucide icons", () => {
    // Arrange + Act
    const files = [
      "features/member/components/sesi-playback.tsx",
      "features/member/components/sesi-info-card.tsx",
      "features/member/components/sesi-actions.tsx",
    ];

    // Assert
    for (const file of files) {
      expect(read(file)).not.toContain("absolute");
    }
    expect(read("features/member/components/sesi-actions.tsx")).toContain(
      "lucide-react",
    );
  });
});

describe("sesi route", () => {
  it("keeps the sesi route thin with static params and no client boundary", () => {
    // Arrange + Act
    const layout = read("app/(member)/latihan/[slug]/sesi/layout.tsx");
    const page = read("app/(member)/latihan/[slug]/sesi/page.tsx");

    // Assert
    expect(layout).not.toContain("use client");
    expect(page).not.toContain("use client");
    expect(page).toContain("generateStaticParams");
    expect(page).toContain("sesiSlugs");
    expect(page).toContain("@/features/member/pages/sesi-page");
    expect(page).toContain("SesiPage");
  });

  it("suspends playback, info, and actions behind skeleton fallbacks", () => {
    // Arrange + Act
    const src = read("features/member/pages/sesi-page.tsx");

    // Assert
    expect(src).toContain("Suspense");
    expect(src).toContain("Skeleton");
    expect(src).toContain("notFound");
    expect(src).toContain("getSesi");
    expect(src).toContain("SesiPlayback");
    expect(src).toContain("SesiInfoCard");
    expect(src).toContain("SesiActions session");
    expect(src.match(/Suspense/g)?.length).toBeGreaterThanOrEqual(3);
  });

  it("owns one member shell per leaf without double chrome", () => {
    // Arrange + Act
    const slug = read("app/(member)/latihan/[slug]/layout.tsx");
    const detail = read("app/(member)/latihan/[slug]/sesi/layout.tsx");

    // Assert
    expect(slug).not.toContain("MemberLayout");
    expect(detail).toContain("MemberLayout");
    expect(detail).toContain('activeTab="latihan"');
    expect(detail).toContain("Ulasan Sesi");
  });

  it("links the rekam Selesai CTA live to the sesi route", () => {
    // Arrange + Act
    const src = read("features/member/components/rekam-selesai-cta.tsx");

    // Assert
    expect(src).toContain("Selesai");
    expect(src).toContain("/latihan/${slug}/sesi");
    expect(src).toContain("Link");
    expect(src).not.toContain("aria-disabled");
    expect(src).not.toContain("TODO");
  });
});
