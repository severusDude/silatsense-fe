import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const section = readFileSync("features/coach/components/member-history-section.tsx", "utf8");
const card = readFileSync("features/coach/components/history-session-card.tsx", "utf8");
const pagination = readFileSync("features/coach/components/history-pagination.tsx", "utf8");
const all = [section, card, pagination].join("\n");

describe("member history sections", () => {
  it("builds the log as a section with the Figma header, count badge, and description", () => {
    // Arrange + Act + Assert
    expect(section).toContain("<section");
    expect(section).toContain("Daftar Riwayat Sesi");
    expect(section).toContain("META_BADGE_VARIANT.count");
    expect(section).toContain("Catatan telemetri repetisi dan akurasi sensorik MediaPipe.");
    expect(section).toContain("<ul");
    expect(section).toContain("<li");
    expect(section).toContain("HistorySessionCard");
    expect(section).toContain("HistoryPagination");
  });

  it("renders static session cards with tone dot, Skor AI caption, and one helper badge", () => {
    // Arrange + Act + Assert
    expect(card).toContain('<Card size="sm">');
    expect(card).toContain("session.sesiLabel");
    expect(card).toContain("session.dateLabel");
    expect(card).toContain("toFixed(1)");
    expect(card).toContain("Skor AI");
    expect(card).toContain("size-1.5");
    expect(card).toContain("performanceBadgeLabel");
    expect(card).toContain("performanceBadgeVariant");
    expect(card).toContain("text-success-foreground");
    expect(card).toContain("bg-warning-foreground");
    expect(card).toContain("<CardFooter");
    expect(card).not.toContain("href=");
  });

  it("paginates functionally via ?page= links with aria-current and disabled edges", () => {
    // Arrange + Act + Assert
    expect(pagination).toContain("Menampilkan");
    expect(pagination).toContain("total sesi biomekanika");
    expect(pagination).toContain("Sebelumnya");
    expect(pagination).toContain("Selanjutnya");
    expect(pagination).toContain("aria-current");
    expect(pagination).toContain("`/coach/members/${memberId}/riwayat?page=${page - 1}`");
    expect(pagination).toContain("`/coach/members/${memberId}/riwayat?page=${page + 1}`");
    expect(pagination).toContain("disabled");
    expect(pagination).toContain("aria-label=");
  });

  it("keeps the user badge rule: bare labels, no Figma strings, lucide only", () => {
    // Arrange + Act + Assert
    expect(all).toContain("performanceBadgeLabel");
    expect(all).toContain("ChevronLeft");
    expect(all).toContain("ChevronRight");
    expect(all).toContain("lucide-react");
    expect(all).not.toContain("Sesuai Skor Kualitas");
    expect(all).not.toContain("Standar IPSI");
    expect(all).not.toContain("Optimal (");
    expect(all).not.toContain("Sayap Siku");
    expect(all).not.toContain("Perlu Poles");
    expect(all).not.toContain("(-6.5");
    expect(all).not.toContain("(+8cm)");
    expect(all).not.toContain("evaluasi");
    expect(all).not.toContain('"use client"');
    expect(all).not.toContain("<svg");
    expect(all).not.toContain("absolute");
    expect(all).not.toContain("next/image");
  });
});
