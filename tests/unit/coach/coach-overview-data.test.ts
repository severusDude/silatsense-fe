import { describe, expect, it } from "vitest";
import { dummyCoachOverview } from "@/features/coach/data/coach-overview-dummy";

describe("dummyCoachOverview", () => {
  it("pins team totals (5 athletes, 84.6% vs 85% target, 2-session queue)", () => {
    // Arrange + Act
    const { teamAccuracyPct, accuracyTargetPct, reviewQueue } = dummyCoachOverview;

    // Assert
    expect(teamAccuracyPct).toBe(84.6);
    expect(accuracyTargetPct).toBe(85);
    expect(reviewQueue).toEqual(["Aced S.", "Siti N."]);
  });

  it("exposes five athletes with Figma scores and last-gerakan subtitles", () => {
    // Arrange + Act
    const rows = dummyCoachOverview.athletes.map((a) => [a.name, a.scorePct, a.lastGerakan]);

    // Assert
    expect(rows).toEqual([
      ["Aced Suryana", 80, "Kuda-kuda"],
      ["Siti Nurhaliza", 76, "Tendangan"],
      ["Rian Mahendra", 94, "Kuda-kuda"],
      ["Fajar Pratama", 91, "Pukulan"],
      ["Dimas Wicaksono", 88, "Tangkisan"],
    ]);
  });

  it("exposes four pillars in Figma order with Figma averages", () => {
    // Arrange + Act
    const slugs = dummyCoachOverview.pillars.map((p) => [p.slug, p.avgPct]);

    // Assert
    expect(slugs).toEqual([["kuda-kuda", 94.8], ["tangkisan", 89.0], ["pukulan", 82.0], ["tendangan", 78.0]]);
  });

  it("covers five posture points with Siku Kanan and Pronasi flagged", () => {
    // Arrange + Act
    const flagged = dummyCoachOverview.posture.filter((p) => p.warning).map((p) => p.id);

    // Assert
    expect(dummyCoachOverview.posture).toHaveLength(5);
    expect(flagged).toEqual(["siku-kanan", "pronasi-pergelangan"]);
  });
});
