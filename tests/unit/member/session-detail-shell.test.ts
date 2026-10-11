import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

describe("session coach card", () => {
  it("uses Badge Menunggu without Terverifikasi pill and without images", () => {
    // Arrange + Act
    const src = read("features/member/components/session-coach-card.tsx");

    // Assert
    expect(src).toContain("@/components/ui/badge");
    expect(src).toContain('variant="warning"');
    expect(src).toContain("Menunggu");
    expect(src).toContain("Keputusan sidang pelatih");
    expect(src).toContain("uppercase");
    expect(src).toContain("Tahap remidiasi teknis");
    expect(src).toContain("decidedAtLabel");
    expect(src).toContain("focusTechnique");
    expect(src).toContain("coach.initials");
    expect(src).not.toContain("Terverifikasi Resmi");
    expect(src).not.toContain("<img");
  });

  it("keeps the coach card flex-only", () => {
    // Arrange + Act + Assert
    expect(read("features/member/components/session-coach-card.tsx")).not.toContain("absolute");
  });
});

describe("session kelayakan card", () => {
  it("badges IPSI CLASS B outline plus Lolos/Fokus/Remidi pillar stages", () => {
    // Arrange + Act
    const src = read("features/member/components/session-kelayakan-card.tsx");

    // Assert
    expect(src).toContain("@/components/ui/badge");
    expect(src).toContain("IPSI CLASS B");
    expect(src).toContain('variant="outline"');
    expect(src).toContain("stageLabel");
    expect(src).toContain("scorePct");
    expect(src).toContain("targetPct");
    expect(src).toContain("retestLabel");
    expect(src).toContain("retestValue");
    expect(src).toContain("Syarat Kelulusan:");
    expect(src).toContain("Catatan Penguji:");
    expect(src).not.toContain("Latihan Mandiri");
    expect(src).not.toContain("Perlu Perbaikan");
  });

  it("keeps the kelayakan card flex-only", () => {
    // Arrange + Act + Assert
    expect(read("features/member/components/session-kelayakan-card.tsx")).not.toContain("absolute");
  });
});
