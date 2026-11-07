import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const page = readFileSync("app/(coach)/coach/members/[id]/(detail)/page.tsx", "utf8");
const layout = readFileSync("app/(coach)/coach/members/[id]/(detail)/layout.tsx", "utf8");
const detailPage = readFileSync("features/coach/pages/member-detail-page.tsx", "utf8");
const cardList = readFileSync("features/coach/components/member-card-list.tsx", "utf8");

describe("member detail route", () => {
  it("wires the thin RSC [id] route with static params and no client code", () => {
    // Arrange + Act + Assert
    expect(page).toContain("MemberDetailPage");
    expect(page).toContain("generateStaticParams");
    expect(page).toContain("memberDetailIds");
    expect(page).not.toContain('"use client"');
    expect(page).not.toContain("getMemberDetail");
  });

  it("renders the detail route inside the coach shell members tab with Detail trail", () => {
    // Arrange + Act + Assert
    expect(layout).toContain("CoachLayout");
    expect(layout).toContain('activeTab="members"');
    expect(layout).toContain("Detail");
  });

  it("streams five sections behind Suspense units with 404 on unknown id", () => {
    // Arrange + Act + Assert
    expect(detailPage).toContain("MemberDetailProfile");
    expect(detailPage).toContain("PilarPerformanceSection");
    expect(detailPage).toContain("LatestEvaluationSection");
    expect(detailPage).toContain("MemberFeedbackCard");
    expect(detailPage).toContain("SessionHistoryLog");
    expect(detailPage).toContain("<Suspense");
    expect(detailPage).toContain("notFound");
    expect(detailPage).not.toContain('"use client"');
  });

  it("links every list card to its live detail route", () => {
    // Arrange + Act + Assert
    expect(cardList).toContain("`/coach/members/${member.id}`");
    expect(cardList).toContain("Lihat Detail");
    expect(cardList).not.toContain("TODO");
  });
});
