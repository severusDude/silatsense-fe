import { describe, expect, it } from "vitest";
import { dummyTeamMembers, dummyTeamMemberStats } from "@/features/coach/data/team-members-dummy";
import { stageBadgeVariant } from "@/features/coach/components/coach-stage";

describe("dummyTeamMembers", () => {
  it("exposes five members with Figma scores, trimmed gerakan, and NIM", () => {
    // Arrange + Act
    const rows = dummyTeamMembers.members.map((m) => [m.name, m.scorePct, m.lastGerakan, m.nim]);

    // Assert
    expect(dummyTeamMembers.totalAktif).toBe(5);
    expect(rows).toEqual([
      ["Aced Suryana", 80, "Kuda-kuda", "2307051"],
      ["Siti Nurhaliza", 76, "Tendangan", "2307052"],
      ["Rian Mahendra", 94, "Kuda-kuda", "2307053"],
      ["Fajar Pratama", 91, "Pukulan", "2307054"],
      ["Dimas Wicaksono", 88, "Tangkisan", "2307055"],
    ]);
  });

  it("pins the four member-list stats with Figma literals", () => {
    // Arrange + Act
    const rows = dummyTeamMemberStats.map((s) => [s.label, s.value, s.badge ?? null, s.note ?? null]);

    // Assert
    expect(rows).toEqual([
      ["Total Binaan", "5 Atlet", "3 Siap • 2 Remediasi", null],
      ["Rata Akurasi", "84.6%", "Target IPSI ≥ 85% (-0.4%)", null],
      ["Kelulusan", "60%", null, "Memenuhi Standar"],
      ["Sesi Rekaman", "24 Sesi", "+3.8%", "Pekan Ini Tercatat"],
    ]);
  });

  it("carries no footer pairs on member-list stats", () => {
    // Arrange + Act
    const footered = dummyTeamMemberStats.filter((s) => s.footerLeft ?? s.footerRight);

    // Assert
    expect(footered).toEqual([]);
  });

  it("maps every member stage to the dashboard Badge variant", () => {
    // Arrange + Act
    const variants = dummyTeamMembers.members.map((m) => stageBadgeVariant(m.stage));

    // Assert
    expect(variants).toEqual(["warning", "warning", "success", "success", "success"]);
  });

  it("keeps trimmed subtitles free of Figma detail suffixes", () => {
    // Arrange + Act
    const raw = JSON.stringify(dummyTeamMembers.members);

    // Assert
    expect(raw).not.toContain("Tumpuan");
    expect(raw).not.toContain("Recoil");
    expect(raw).not.toContain("Simetris");
    expect(raw).not.toContain("142");
  });
});
