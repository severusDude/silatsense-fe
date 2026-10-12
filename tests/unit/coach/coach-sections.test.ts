import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dummyCoachOverview } from "@/features/coach/data/coach-overview-dummy";

const statGrid = readFileSync("features/coach/components/coach-stat-grid.tsx", "utf8");
const athleteList = readFileSync("features/coach/components/coach-athlete-list.tsx", "utf8");

describe("coach sections", () => {
  it("renders the team stat grid shell for the four Figma stats", () => {
    // Arrange + Act
    const values = dummyCoachOverview.stats.map((s) => s.value);

    // Assert (structure lives in source, values flow in via props)
    expect(statGrid).toContain("Statistik tim");
    expect(statGrid).toContain('"total-atlet"');
    expect(statGrid).toContain('"akurasi-tim"');
    expect(statGrid).toContain("antrean");
    expect(statGrid).toContain("fokus");
    expect(values).toEqual(["5 Atlet", "84.6%", "2 Sesi", "Elevasi Siku"]);
  });

  it("renders the athlete list card with a single dead footer affordance", () => {
    // Arrange + Act + Assert
    expect(athleteList).toContain("Ringkasan Latihan Member");
    expect(athleteList).toContain("5 Atlet");
    expect(athleteList).toContain("Lihat Detail");
    expect(athleteList).toContain("/coach/members/[id]");
    expect(athleteList).not.toContain("MediaPipe");
  });
});
