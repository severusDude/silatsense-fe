import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const page = readFileSync("app/(coach)/coach/members/(list)/page.tsx", "utf8");
const listLayout = readFileSync("app/(coach)/coach/members/(list)/layout.tsx", "utf8");
const segmentLayout = readFileSync("app/(coach)/coach/members/layout.tsx", "utf8");
const parentLayout = readFileSync("app/(coach)/coach/layout.tsx", "utf8");
const dashboardPage = readFileSync("app/(coach)/coach/page.tsx", "utf8");
const membersPage = readFileSync("features/coach/pages/coach-members-page.tsx", "utf8");
const search = readFileSync("features/coach/components/member-search.tsx", "utf8");

describe("members route", () => {
  it("wires the thin RSC route to the members page composition", () => {
    // Arrange + Act + Assert
    expect(page).toContain("CoachMembersPage");
    expect(page).not.toContain('"use client"');
    expect(page).not.toContain("getTeamMembers");
  });

  it("renders the members list inside the coach shell members tab", () => {
    // Arrange + Act + Assert
    expect(listLayout).toContain("CoachLayout");
    expect(listLayout).toContain('activeTab="members"');
    expect(listLayout).toContain("Member List");
  });

  it("keeps the members segment layout pass-through so each leaf owns one shell", () => {
    // Arrange + Act + Assert
    // Regression: an ancestor segment layout must not render CoachLayout, or the
    // nested [id] leaf shell stacks a second header/nav (double-chrome bug).
    expect(segmentLayout).not.toContain("CoachLayout");
  });

  it("streams header, stats, and search list behind Suspense units", () => {
    // Arrange + Act + Assert
    expect(membersPage).toContain("MemberHeader");
    expect(membersPage).toContain("MemberStatGrid");
    expect(membersPage).toContain("MemberSearch");
    expect(membersPage).toContain("<Suspense");
    expect(membersPage).toContain("getTeamMembers");
    expect(membersPage).toContain("getTeamMemberStats");
    expect(membersPage).not.toContain('"use client"');
  });

  it("keeps the search island client-side with name-or-NIM filtering", () => {
    // Arrange + Act + Assert
    expect(search).toContain('"use client"');
    expect(search).toContain("filterMembers");
    expect(search).toContain("Cari nama atlet atau NIM");
    expect(search).toContain("MemberCardList");
    expect(search).not.toContain("getTeamMembers");
    expect(search).not.toContain("absolute");
  });

  it("renders exactly one coach shell on the dashboard (parent layout is pass-through)", () => {
    // Arrange + Act
    // (parentLayout + dashboardPage reads at top of file)

    // Assert
    expect(parentLayout).not.toContain("CoachLayout");
    expect(dashboardPage).toContain("<CoachLayout>");
    expect(dashboardPage).toContain("CoachDashboardPage");
  });
});
