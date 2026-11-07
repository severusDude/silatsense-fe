import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

describe("session coach card", () => {
  it("uses dynamic decision badges and collapsible history", () => {
    // Arrange + Act
    const src = read("features/member/components/session-coach-card.tsx");

    // Assert
    expect(src).toContain("@/components/ui/badge");
    expect(src).toContain("Keputusan sidang pelatih");
    expect(src).toContain("reviewDecisionLabel");
    expect(src).toContain("Riwayat Tinjauan Sebelumnya");
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
  it("carries honest UI with Segera hadir badges and poin score", () => {
    // Arrange + Act
    const src = read("features/member/components/session-kelayakan-card.tsx");

    // Assert
    expect(src).toContain("@/components/ui/badge");
    expect(src).toContain("Segera hadir");
    expect(src).toContain("Ringkasan Evaluasi Kinematika");
    expect(src).toContain("Skor Kemiripan Sesi");
    expect(src).toContain("poin");
    expect(src).toContain("Status Kelayakan Tanding / IPSI");
    expect(src).toContain("opacity-60 bg-muted/20 border-dashed border-border/80");
    expect(src).not.toContain("85%");
    expect(src).not.toContain("Dojo UNSIL");
    expect(src).not.toContain("2 Okt 2026");
    expect(src).not.toContain("pillarBadgeVariant");
    expect(src).not.toContain("Perlu Perbaikan");
  });

  it("keeps the kelayakan card flex-only", () => {
    // Arrange + Act + Assert
    expect(read("features/member/components/session-kelayakan-card.tsx")).not.toContain("absolute");
  });
});

describe("session video player", () => {
  it("renders real video element with stream proxy and metadata preload", () => {
    // Arrange + Act
    const src = read("features/member/components/session-video-placeholder.tsx");

    // Assert
    expect(src).toContain("CardTitle");
    expect(src).toContain("techniqueName");
    expect(src).toContain("techniqueDesc");
    expect(src).toContain("aspect-video");
    expect(src).toContain("<video");
    expect(src).toContain('preload="metadata"');
    expect(src).toContain("/api/member/sessions/${session.id}/video");
    expect(src).not.toContain("TODO");
    expect(src).not.toContain("<img");
    expect(src).not.toContain("absolute");
  });
});

describe("session posture list", () => {
  it("switches empty state versus posture items with AI deviation and coach badges", () => {
    // Arrange + Act
    const list = read("features/member/components/session-posture-list.tsx");
    const item = read("features/member/components/session-posture-item.tsx");

    // Assert
    expect(list).toContain("Catatan Pelatih");
    expect(list).toContain("ScoreRing");
    expect(list).toContain("evaluasi-posture-list");
    expect(list).toContain("sesuai");
    expect(list).toContain("Belum ada catatan dari pelatih");
    expect(list).not.toContain("absolute");

    expect(item).toContain("@/components/ui/badge");
    expect(item).toContain("statusLabel");
    expect(item).toContain("Deviasi AI");
    expect(item).toContain("Catatan Pelatih");
    expect(item).toContain("Catatan:");
    expect(item).toContain("Koreksi:");
    expect(item).toContain("correctionCue");
    expect(item).not.toContain("absolute");
    expect(item).not.toContain("<img");
    expect(item + list).not.toContain("Perlu Perbaikan");
  });
});

describe("session follow up tasks", () => {
  it("renders live task list with update action triggers", () => {
    // Arrange + Act
    const src = read("features/member/components/session-follow-up-tasks.tsx");

    // Assert
    expect(src).toContain('"use client"');
    expect(src).toContain("updateFollowUpTaskAction");
    expect(src).toContain("Tugas Tindak Lanjut Pelatih");
    expect(src).toContain("Tandai Selesai");
    expect(src).toContain("Abaikan");
    expect(src).not.toContain("absolute");
  });
});

describe("session detail actions", () => {
  it("wires acknowledge and retry actions live", () => {
    // Arrange + Act
    const src = read("features/member/components/session-detail-actions.tsx");

    // Assert
    expect(src).toContain('"use client"');
    expect(src).toContain("acknowledgeSessionAction");
    expect(src).toContain("retrySessionAction");
    expect(src).toContain("Konfirmasi Telah Membaca");
    expect(src).toContain("Mulai Latihan Ulang");
    expect(src).not.toContain("TODO");
    expect(src).not.toContain("absolute");
  });
});

describe("session detail route and page", () => {
  it("keeps the [id] route thin without generateStaticParams", () => {
    // Arrange + Act
    const route = read("app/(member)/riwayat/[id]/page.tsx");
    const layout = read("app/(member)/riwayat/layout.tsx");
    const page = read("features/member/pages/session-detail-page.tsx");

    // Assert
    expect(route).not.toContain('"use client"');
    expect(route).not.toContain("generateStaticParams");
    expect(route).not.toContain("sessionDetailIds");
    expect(route).toContain("<SessionDetailPage id={id} />");
    expect(layout).toContain('activeTab="riwayat"');
    expect(page).not.toContain('"use client"');
    expect(page).toContain("Suspense");
    expect(page).toContain("notFound");
    expect(page).toContain("SessionCoachCard");
    expect(page).toContain("SessionKelayakanCard");
    expect(page).toContain("SessionVideoPlaceholder");
    expect(page).toContain("SessionPostureList");
    expect(page).toContain("SessionFollowUpTasks");
    expect(page).toContain("SessionDetailActions");
    expect(page).not.toContain("absolute");
    expect(page).not.toContain("Terverifikasi Resmi");
    expect(page).not.toContain("Latihan Mandiri");
  });
});
