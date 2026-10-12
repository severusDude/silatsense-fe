import { describe, expect, it } from "vitest";
import { dummyMemberDashboard } from "@/features/member/data/member-dashboard-dummy";

describe("dummyMemberDashboard", () => {
  it("greets Aced with a 2-day-old Pukulan Lurus focus", () => {
    // Arrange + Act
    const { greeting } = dummyMemberDashboard;

    // Assert
    expect(greeting).toEqual({ name: "Aced", lastSessionDaysAgo: 2, focusTechnique: "Pukulan Lurus" });
  });

  it("carries the Figma hero metric (82%, 14° vs <8°, 2.5m, camera ready)", () => {
    // Arrange + Act
    const { heroMetric } = dummyMemberDashboard;

    // Assert
    expect(heroMetric).toEqual({ accuracyPct: 82, elbowToleranceDeg: 14, targetDeg: 8, cameraDistanceM: 2.5, cameraReady: true });
  });

  it("exposes four pillars in Figma order with Figma averages", () => {
    // Arrange + Act
    const slugs = dummyMemberDashboard.pillars.map((p) => [p.slug, p.avgPct]);

    // Assert
    expect(slugs).toEqual([["kuda-kuda", 94.8], ["pukulan", 82.0], ["tangkisan", 89.5], ["tendangan", 76.0]]);
  });

  it("marks only Pukulan as the active focus card", () => {
    // Arrange + Act
    const active = dummyMemberDashboard.pillars.filter((p) => p.active).map((p) => p.slug);

    // Assert
    expect(active).toEqual(["pukulan"]);
  });

  it("covers a 7-day week with Kam highlighted and Rab resting", () => {
    // Arrange + Act
    const days = dummyMemberDashboard.weekly.days.map((d) => [d.label, d.state]);

    // Assert
    expect(days).toEqual([["Sen", "filled"], ["Sel", "filled"], ["Rab", "rest"], ["Kam", "active"], ["Jum", "empty"], ["Sab", "empty"], ["Min", "empty"]]);
  });

  it("keeps three Figma observations plus the Kang Fauzan note", () => {
    // Arrange + Act
    const { lastSession, coachNote } = dummyMemberDashboard;

    // Assert
    expect(lastSession.observations).toHaveLength(3);
    expect(coachNote.name).toBe("Kang Fauzan");
  });
});
