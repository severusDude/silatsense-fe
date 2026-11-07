import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const statGrid = readFileSync("features/coach/components/coach-stat-grid.tsx", "utf8");
const athleteList = readFileSync("features/coach/components/coach-athlete-list.tsx", "utf8");
const pillarMonitor = readFileSync("features/coach/components/coach-pillar-monitor.tsx", "utf8");
const postureGrid = readFileSync("features/coach/components/coach-posture-grid.tsx", "utf8");

describe("coach sections", () => {
  it("renders the team stat grid shell for the four stats with honest UI slots", () => {
    expect(statGrid).toContain("Statistik tim");
    expect(statGrid).toContain('"total-atlet"');
    expect(statGrid).toContain('"akurasi-tim"');
    expect(statGrid).toContain('"sidang-uji"');
    expect(statGrid).toContain("fokus");
    expect(statGrid).toContain("justify-between");
    expect(statGrid).toContain("footerLeft");
    expect(statGrid).toContain("footerRight");
  });

  it("renders live athlete links, score in poin, and empty state", () => {
    expect(athleteList).toContain("Ringkasan Latihan Member");
    expect(athleteList).toContain("Lihat Detail");
    expect(athleteList).toContain("athlete.detailHref");
    expect(athleteList).toContain("athlete.scoreLabel");
    expect(athleteList).toContain("buttonVariants");
    expect(athleteList).toContain("Belum ada atlet binaan");
    expect(athleteList).not.toContain("scorePct");
    expect(athleteList).not.toContain("/coach/members/[id]");
  });

  it("renders pillar monitor with poin, sample label, barPercent, and dimmed target", () => {
    expect(pillarMonitor).toContain("Monitoring 4 Pilar Gerakan");
    expect(pillarMonitor).toContain("Ambang target: Segera hadir");
    expect(pillarMonitor).toContain("pillar.scoreLabel");
    expect(pillarMonitor).toContain("pillar.sampleLabel");
    expect(pillarMonitor).toContain("pillar.barPercent");
    expect(pillarMonitor).not.toContain("avgPct");
  });

  it("renders dynamic posture grid with title, banner, tiles, and empty state", () => {
    expect(postureGrid).toContain("Isu Postur Teratas Tim");
    expect(postureGrid).toContain("Belum ada isu postur terdeteksi");
    expect(postureGrid).toContain("banner.name");
    expect(postureGrid).toContain("sesi terindikasi");
    expect(postureGrid).toContain("tiles.map");
    expect(postureGrid).not.toContain("scorePct");
  });
});
