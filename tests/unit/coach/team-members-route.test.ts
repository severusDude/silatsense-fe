import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const page = readFileSync("app/(coach)/coach/members/page.tsx", "utf8");
const layout = readFileSync("app/(coach)/coach/members/layout.tsx", "utf8");
const membersPage = readFileSync("features/coach/pages/coach-members-page.tsx", "utf8");
const search = readFileSync("features/coach/components/member-search.tsx", "utf8");

describe("members route", () => {
  it("wires the thin RSC route to the members page composition", () => {
    // Arrange + Act + Assert
    expect(page).toContain("CoachMembersPage");
    expect(page).not.toContain('"use client"');
    expect(page).not.toContain("getTeamMembers");
  });

  it("renders the members route inside the coach shell members tab", () => {
    // Arrange + Act + Assert
    expect(layout).toContain("CoachLayout");
    expect(layout).toContain('activeTab="members"');
    expect(layout).toContain("Member List");
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
});
