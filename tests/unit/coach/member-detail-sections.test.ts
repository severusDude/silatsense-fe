import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const profile = readFileSync("features/coach/components/member-detail-profile.tsx", "utf8");
const pilar = readFileSync("features/coach/components/pillar-performance-section.tsx", "utf8");
const evaluasi = readFileSync("features/coach/components/latest-evaluation.tsx", "utf8");
const posture = readFileSync("features/coach/components/posture-param-row.tsx", "utf8");
const feedbackCard = readFileSync("features/coach/components/member-feedback-card.tsx", "utf8");
const feedbackForm = readFileSync("features/coach/components/member-feedback-form.tsx", "utf8");
const history = readFileSync("features/coach/components/session-history-log.tsx", "utf8");
const all = [profile, pilar, evaluasi, posture, feedbackCard, feedbackForm, history].join("\n");

describe("member detail sections", () => {
  it("keeps every section a <section> root, with the profile blocks inside Cards", () => {
    // Arrange + Act + Assert
    expect(profile).toContain("<section");
    expect(profile).toContain("<Card");
    expect(evaluasi).toContain("<section");
    expect(history).toContain("<section");
    expect(history).toContain("Riwayat Sesi Terkini");
  });

  it("builds pilar as a section with per-pilar tile Cards (no outer Card chrome)", () => {
    // Arrange + Act + Assert
    expect(pilar).toContain("<section");
    expect(pilar).toContain("Performa 4 Pilar Dasar");
    expect(pilar).toContain("4 Pilar");
    expect(pilar).toContain('size="sm"');
    expect(pilar).toContain("Lihat semua");
    expect(pilar).not.toContain("<CardFooter");
    expect(pilar).not.toContain("<CardAction");
  });

  it("builds feedback as a full Card with a footer", () => {
    // Arrange + Act + Assert
    expect(feedbackCard).toContain("<CardHeader");
    expect(feedbackCard).toContain("<CardTitle");
    expect(feedbackCard).toContain("Feedback Koreksi Pelatih");
    expect(feedbackForm).toContain("<CardContent");
    expect(feedbackForm).toContain("<CardFooter");
    expect(feedbackForm).toContain("Simpan Draft");
    expect(feedbackForm).toContain("Kirim ke Member");
  });

  it("wraps evaluation score, metrics, quick stats, and posture rows in Cards", () => {
    // Arrange + Act + Assert
    expect(evaluasi).toContain("<Card");
    expect(evaluasi).toContain("Penilaian Postur Anatomis");
    expect(posture).toContain("<Card");
    expect(posture).toContain("<li>");
  });

  it("restricts Badges to the allowlist with bare performance labels", () => {
    // Arrange + Act + Assert
    expect(all).toContain("performanceBadgeLabel");
    expect(all).toContain("Standar IPSI");
    expect(all).not.toContain("Perlu Poles");
    expect(all).not.toContain("Perlu Perbaikan");
    expect(all).not.toContain("Tahap Remediasi");
    expect(all).not.toContain("Bimbingan");
    expect(all).not.toContain("Siap Tanding");
    expect(all).not.toContain("Lolos Standar");
    expect(posture).not.toContain("(135");
    expect(posture).not.toContain("(142");
  });

  it("derives avatar initials via helper with placeholders and lucide only", () => {
    // Arrange + Act + Assert
    expect(profile).toContain("getInitials");
    expect(profile).toContain('role="img"');
    expect(evaluasi).toContain("ImagePlaceholder");
    expect(evaluasi).toContain("Visual tracking Pukulan Lurus Depan");
    expect(pilar).toContain("PersonStanding");
    expect(pilar).toContain("Footprints");
    expect(all).toContain("lucide-react");
    expect(all).not.toContain("<svg");
    expect(all).not.toContain("absolute");
    expect(all).not.toContain("next/image");
  });

  it("stubs feedback against POST /coach/feedback with read-your-own-write", () => {
    // Arrange + Act + Assert
    expect(feedbackForm).toContain('"use client"');
    expect(feedbackForm).toContain("POST /coach/feedback");
    expect(feedbackForm).toContain('["member-detail", memberId]');
    expect(feedbackForm).toContain("toast.promise");
  });
});
