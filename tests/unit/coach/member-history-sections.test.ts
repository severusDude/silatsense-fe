import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const section = readFileSync("features/coach/components/member-history-section.tsx", "utf8");
const card = readFileSync("features/coach/components/history-session-card.tsx", "utf8");
const pagination = readFileSync("features/coach/components/history-pagination.tsx", "utf8");
const all = [section, card, pagination].join("\n");

describe("member history sections", () => {
  it("builds the log as a section with the header, count badge, and description", () => {
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

  it("renders session cards with date badge, time, scoreLabel, and review status badge", () => {
    // Arrange + Act + Assert
    expect(card).toContain('<Card size="sm">');
    expect(card).toContain("session.dateLabel");
    expect(card).toContain("session.scoreLabel");
    expect(card).toContain("Skor AI");
    expect(card).toContain("session.statusVariant");
    expect(card).toContain("session.statusLabel");
    expect(card).toContain("<CardFooter");
    expect(card).not.toContain("href=");
  });

  it("paginates via cursor links with Muat Lebih Banyak and Kembali ke Awal", () => {
    // Arrange + Act + Assert
    expect(pagination).toContain("Navigasi halaman riwayat sesi");
    expect(pagination).toContain("Muat Lebih Banyak");
    expect(pagination).toContain("Kembali ke Awal");
    expect(pagination).toContain("cursor=");
    expect(pagination).not.toContain("aria-current");
  });

  it("keeps the user badge rule: bare labels, no dummy literals, no client boundary", () => {
    // Arrange + Act + Assert
    expect(all).not.toContain("Sesuai Skor Kualitas");
    expect(all).not.toContain("Standar IPSI");
    expect(all).not.toContain("Optimal (");
    expect(all).not.toContain("Sayap Siku");
    expect(all).not.toContain("Perlu Poles");
    expect(all).not.toContain("(-6.5");
    expect(all).not.toContain("(+8cm)");
    expect(all).not.toContain('"use client"');
    expect(all).not.toContain("<svg");
    expect(all).not.toContain("absolute");
    expect(all).not.toContain("next/image");
  });
});
