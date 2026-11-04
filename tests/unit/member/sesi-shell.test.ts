import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

describe("sesi components", () => {
  it("streams the real recording through the authenticated BFF route", () => {
    // Arrange + Act
    const src = read("features/member/components/sesi-playback.tsx");

    // Assert
    expect(src).not.toContain("absolute");
    expect(src).toContain('session.mediaStatus === "available"');
    expect(src).toContain("/api/member/sessions/${session.id}/video");
    expect(src).toContain("aspect-[3/4]");
    expect(src).toContain("<video");
    expect(src).toContain("controls");
    expect(src).toContain("MediaUnavailable");
    expect(src).not.toContain("placeholder");
    expect(src).not.toContain("durationLabel");
  });

  it("renders BE-only recording rows without camera or FPS", () => {
    // Arrange + Act
    const src = read("features/member/components/sesi-info-card.tsx");

    // Assert
    expect(src).not.toContain("absolute");
    expect(src).toContain("Latihan");
    expect(src).toContain("Durasi");
    expect(src).toContain("Mulai");
    expect(src).toContain("Diunggah");
    expect(src).toContain("Ukuran berkas");
    expect(src).toContain("Resolusi");
    expect(src).toContain("Format");
    expect(src).not.toContain("Kamera");
    expect(src).not.toContain("FPS");
    expect(src).toContain("processingLabel");
    expect(src).toContain("analysisStatusLabel");
    expect(src).toContain("error.detail");
    expect(src).toContain("eyebrow");
  });

  it("links review actions to the session-keyed evaluation and retake routes", () => {
    // Arrange + Act
    const src = read("features/member/components/sesi-actions.tsx");

    // Assert
    expect(src).toContain("Lihat Evaluasi");
    expect(src).toContain("/latihan/${session.slug}/evaluasi/${session.id}");
    expect(src).toContain("/latihan/${session.slug}/rekam");
    expect(src).toContain("Latihan Ulang");
    expect(src).toContain("Rekam Ulang");
    expect(src).toContain("processingStatus");
    expect(src).not.toContain("use client");
    expect(src).not.toContain("setInterval");
    expect(src).not.toContain("Attachment");
    expect(src).not.toContain("Upload");
  });

  it("polls processing status with a capped refresh loop and manual reload", () => {
    // Arrange + Act
    const src = read("features/member/components/session-status-poller.tsx");

    // Assert
    expect(src).toContain("use client");
    expect(src).toContain("router.refresh()");
    expect(src).toContain("MAX_POLLS");
    expect(src).toContain("clearInterval");
    expect(src).toContain("Muat ulang");
    expect(src).toContain("role=\"status\"");
    expect(src).toContain("motion-reduce:animate-none");
  });

  it("keeps all sesi UI flex-only with lucide icons", () => {
    // Arrange + Act
    const files = [
      "features/member/components/sesi-playback.tsx",
      "features/member/components/sesi-info-card.tsx",
      "features/member/components/sesi-actions.tsx",
      "features/member/components/session-status-poller.tsx",
      "features/member/components/media-unavailable.tsx",
    ];

    // Assert
    for (const file of files) {
      expect(read(file)).not.toContain("absolute");
    }
    expect(read("features/member/components/sesi-actions.tsx")).toContain(
      "lucide-react",
    );
    expect(read("features/member/components/media-unavailable.tsx")).toContain(
      "lucide-react",
    );
  });
});

describe("sesi route", () => {
  it("keeps the session route thin and keyed by sessionId", () => {
    // Arrange + Act
    const layout = read(
      "app/(member)/latihan/[slug]/sesi/[sessionId]/layout.tsx",
    );
    const page = read("app/(member)/latihan/[slug]/sesi/[sessionId]/page.tsx");

    // Assert
    expect(layout).not.toContain("use client");
    expect(page).not.toContain("use client");
    expect(page).not.toContain("generateStaticParams");
    expect(page).toContain("sessionId");
    expect(page).toContain("@/features/member/pages/sesi-page");
    expect(page).toContain("SesiPage");
  });

  it("reads the session once and rejects a mismatched movement slug", () => {
    // Arrange + Act
    const src = read("features/member/pages/sesi-page.tsx");

    // Assert
    expect(src).toContain("Suspense");
    expect(src).toContain("Skeleton");
    expect(src).toContain("notFound");
    expect(src).toContain("getSession");
    expect(src.match(/getSession\(/g)).toHaveLength(1);
    expect(src).toContain("isTrainingModuleSlug");
    expect(src).toContain("session.slug !== slug");
    expect(src).toContain("SessionStatusPoller");
    expect(src).toContain("SesiPlayback");
    expect(src).toContain("SesiInfoCard");
    expect(src).toContain("SesiActions session");
  });

  it("owns one member shell per leaf without double chrome", () => {
    // Arrange + Act
    const slug = read("app/(member)/latihan/[slug]/layout.tsx");
    const detail = read(
      "app/(member)/latihan/[slug]/sesi/[sessionId]/layout.tsx",
    );

    // Assert
    expect(slug).not.toContain("MemberLayout");
    expect(detail).toContain("MemberLayout");
    expect(detail).toContain('activeTab="latihan"');
    expect(detail).toContain("Ulasan Sesi");
  });

  it("removes the old slug-only routes and dummy readers", () => {
    // Arrange + Act
    const oldFiles = [
      "app/(member)/latihan/[slug]/sesi/page.tsx",
      "app/(member)/latihan/[slug]/sesi/layout.tsx",
      "features/member/data/get-sesi.ts",
      "features/member/data/sesi-dummy.ts",
    ];

    // Assert
    for (const file of oldFiles) {
      expect(() => read(file)).toThrow();
    }
  });
});
