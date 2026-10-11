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

describe("session video placeholder", () => {
  it("renders HUD copy with a placeholder and no images", () => {
    // Arrange + Act
    const src = read("features/member/components/session-video-placeholder.tsx");

    // Assert
    expect(src).toContain("Objek tinjauan kinematika");
    expect(src).toContain("uppercase");
    expect(src).toContain("techniqueName");
    expect(src).toContain("cameraLabel");
    expect(src).toContain("qualityLabel");
    expect(src).toContain("TODO");
    expect(src).not.toContain("<img");
    expect(src).not.toContain("absolute");
  });
});

describe("session posture list", () => {
  it("switches empty state versus five items with unified wording", () => {
    // Arrange + Act
    const list = read("features/member/components/session-posture-list.tsx");
    const item = read("features/member/components/session-posture-item.tsx");

    // Assert
    expect(list).toContain("Catatan Pelatih");
    expect(list).toContain("3 Sesuai • 2 Koreksi");
    expect(list).toContain("Belum ada catatan dari pelatih");
    expect(list).toContain("postures.length === 0");
    expect(item).toContain("@/components/ui/badge");
    expect(item).toContain("statusLabel");
    expect(read("features/member/data/session-detail-dummy.ts")).toContain("Perlu Koreksi");
    expect(item).toContain("Catatan:");
    expect(item).toContain("Koreksi:");
    expect(item).toContain("correctionCue");
    expect(list).not.toContain("absolute");
    expect(item).not.toContain("absolute");
    expect(item).not.toContain("<img");
    expect(item + list).not.toContain("Perlu Perbaikan");
  });
});

describe("session detail actions", () => {
  it("keeps Konfirmasi dead with endpoint TODO and links remedial to rekam", () => {
    // Arrange + Act
    const src = read("features/member/components/session-detail-actions.tsx");

    // Assert
    expect(src).toContain("Siap Melakukan Remediasi?");
    expect(src).toContain("Konfirmasi Telah Membaca");
    expect(src).toContain("Mulai Remedial Pukulan Sekarang");
    expect(src).toContain("/latihan/pukulan/rekam");
    expect(src).toContain("POST /member/remedial");
    expect(src).toContain("TODO");
    expect(src).not.toContain("absolute");
  });
});
