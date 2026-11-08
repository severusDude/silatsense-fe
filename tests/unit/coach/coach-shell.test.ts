import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const bottomNav = readFileSync("features/coach/components/coach-bottom-nav.tsx", "utf8");
const topNav = readFileSync("features/coach/components/coach-top-nav.tsx", "utf8");
const header = readFileSync("features/coach/components/coach-header.tsx", "utf8");

describe("coach shell", () => {
  it("exposes four tabs with Profil linking to the shared /profil route", () => {
    expect(bottomNav).toContain('"/coach"');
    expect(bottomNav).toContain('"/coach/members"');
    expect(bottomNav).toContain("Laporan");
    expect(bottomNav).toContain('"/profil"');
  });

  it("shows the session initials coach avatar with Cloud Sinkron (no hardcoded KF)", () => {
    expect(topNav).toContain("getSession");
    expect(topNav).toContain("getInitials");
    expect(topNav).toContain("Cloud Sinkron");
    expect(topNav).not.toContain("KF");
    expect(topNav).not.toContain("Portal");
  });

  it("shows the coach header copy with neutral athlete copy and inactive report CTA", () => {
    expect(header).toContain("Dashboard Pelatih");
    expect(header).toContain(
      "Ringkasan performa latihan mandiri dan monitoring kinematika atlet binaan UKM UNSIL.",
    );
    expect(header).toContain("Unduh Rapor Tim (PDF)");
    expect(header).toContain("Segera hadir");
    expect(header).toContain("GET /coach/report");
    expect(header).not.toContain("5 atlet");
    expect(header).not.toContain("Portal");
  });
});
