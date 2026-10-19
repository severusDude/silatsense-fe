import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const page = readFileSync("app/(coach)/coach/members/[id]/(history)/riwayat/page.tsx", "utf8");
const layout = readFileSync("app/(coach)/coach/members/[id]/(history)/riwayat/layout.tsx", "utf8");
const detailPage = readFileSync("app/(coach)/coach/members/[id]/(detail)/page.tsx", "utf8");
const detailLayout = readFileSync("app/(coach)/coach/members/[id]/(detail)/layout.tsx", "utf8");
const historyPage = readFileSync("features/coach/pages/member-history-page.tsx", "utf8");
const sessionLog = readFileSync("features/coach/components/session-history-log.tsx", "utf8");

describe("member history route", () => {
  it("wires the thin RSC riwayat route with static params and forwarded searchParams", () => {
    // Arrange + Act + Assert
    expect(page).toContain("MemberHistoryPage");
    expect(page).toContain("generateStaticParams");
    expect(page).toContain("memberHistoryIds");
    expect(page).toContain("searchParams");
    expect(page).not.toContain('"use client"');
    expect(page).not.toContain("getMemberHistory");
  });

  it("renders the history route inside the coach shell members tab with riwayat trail", () => {
    // Arrange + Act + Assert
    expect(layout).toContain("CoachLayout");
    expect(layout).toContain('activeTab="members"');
    expect(layout).toContain("Daftar Riwayat Sesi Member");
  });

  it("keeps the detail group shell after the move", () => {
    // Arrange + Act + Assert
    expect(detailPage).toContain("MemberDetailPage");
    expect(detailPage).toContain("generateStaticParams");
    expect(detailLayout).toContain("CoachLayout");
    expect(detailLayout).toContain('activeTab="members"');
    expect(detailLayout).toContain("Detail");
  });

  it("streams profile + history sections behind Suspense with 404 on unknown id", () => {
    // Arrange + Act + Assert
    expect(historyPage).toContain("MemberDetailProfile");
    expect(historyPage).toContain("MemberHistorySection");
    expect(historyPage).toContain("<Suspense");
    expect(historyPage).toContain("notFound");
    expect(historyPage).toContain("parseHistoryPage");
    expect(historyPage).toContain("paginateHistory");
    expect(historyPage).toContain("getMemberHistory");
    expect(historyPage).not.toContain('"use client"');
  });

  it("links Buku Semua Riwayat Atlet to the live history route", () => {
    // Arrange + Act + Assert
    expect(sessionLog).toContain("memberId");
    expect(sessionLog).toContain("`/coach/members/${memberId}/riwayat`");
    expect(sessionLog).not.toContain("TODO");
  });
});
