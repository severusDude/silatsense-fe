import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dummyMemberHistory } from "@/features/coach/data/member-history-dummy";
import { paginateHistory, parseHistoryPage } from "@/features/coach/data/paginate-history";

const getSource = readFileSync("features/coach/data/get-member-history.ts", "utf8");

describe("dummyMemberHistory", () => {
  it("ships one member with 24 sessions newest-first at 10 per page", () => {
    // Arrange + Act + Assert
    expect(Object.keys(dummyMemberHistory)).toEqual(["aced-suryana"]);

    const history = dummyMemberHistory["aced-suryana"];

    expect(history.memberId).toBe("aced-suryana");
    expect(history.totalSessions).toBe(24);
    expect(history.pageSize).toBe(10);
    expect(history.sessions).toHaveLength(24);
    expect(history.sessions.map((s) => s.id)).toEqual(
      Array.from({ length: 24 }, (_, i) => `sesi-${24 - i}`)
    );
  });

  it("pins card #24 to the Figma full-frame literals", () => {
    // Arrange + Act + Assert
    expect(dummyMemberHistory["aced-suryana"].sessions[0]).toEqual({
      id: "sesi-24",
      sesiLabel: "Sesi #24",
      dateLabel: "06 Mar 2026, 15:45 WIB",
      title: "Pukulan Lurus Depan",
      subtitle: "Penetapan Sasaran Target",
      repetisiLabel: "Repetisi: 42/50 (84%)",
      scorePct: 82,
      badgeKey: "remediasi",
    });
  });

  it("matches the Figma tone sequence on page one and never uses evaluasi", () => {
    // Arrange + Act + Assert
    const sessions = dummyMemberHistory["aced-suryana"].sessions;

    expect(sessions.slice(0, 10).map((s) => s.badgeKey)).toEqual([
      "remediasi",
      "sesuai",
      "sesuai",
      "tidak-sesuai",
      "remediasi",
      "sesuai",
      "sesuai",
      "tidak-sesuai",
      "sesuai",
      "sesuai",
    ]);
    expect(sessions.every((s) => s.badgeKey !== "evaluasi")).toBe(true);
  });

  it("keeps prototype keys out of the dummy lookup surface", () => {
    // Arrange + Act + Assert
    expect(Object.hasOwn(dummyMemberHistory, "__proto__")).toBe(false);
    expect(Object.hasOwn(dummyMemberHistory, "constructor")).toBe(false);
    expect(dummyMemberHistory["constructor"]).toBeTruthy();
  });
});

describe("parseHistoryPage", () => {
  it("normalizes arrays, decimals, junk, and out-of-range-low values", () => {
    // Arrange + Act + Assert
    expect(parseHistoryPage("2")).toBe(2);
    expect(parseHistoryPage(["3"])).toBe(3);
    expect(parseHistoryPage("2.9")).toBe(2);
    expect(parseHistoryPage(undefined)).toBe(1);
    expect(parseHistoryPage("abc")).toBe(1);
    expect(parseHistoryPage("0")).toBe(1);
    expect(parseHistoryPage("-2")).toBe(1);
  });
});

describe("paginateHistory", () => {
  const sessions = dummyMemberHistory["aced-suryana"].sessions;

  it("slices 10/10/4 with matching ranges and clamps the page", () => {
    // Arrange + Act + Assert
    const page1 = paginateHistory(sessions, 1, 10);
    expect([page1.sessions.length, page1.rangeStart, page1.rangeEnd, page1.totalPages]).toEqual([10, 1, 10, 3]);

    const page2 = paginateHistory(sessions, 2, 10);
    expect([page2.sessions[0].id, page2.rangeStart, page2.rangeEnd]).toEqual(["sesi-14", 11, 20]);

    const page3 = paginateHistory(sessions, 3, 10);
    expect([page3.sessions.length, page3.rangeStart, page3.rangeEnd]).toEqual([4, 21, 24]);

    expect(paginateHistory(sessions, 0, 10).page).toBe(1);
    expect(paginateHistory(sessions, 99, 10).page).toBe(3);
    expect(paginateHistory(sessions, Number.NaN, 10).page).toBe(1);
  });
});

describe("getMemberHistory source", () => {
  it("stays a cached dummy read with the pinned backend TODO", () => {
    // Arrange + Act + Assert
    expect(getSource).toContain('import "server-only"');
    expect(getSource).toContain('"use cache"');
    expect(getSource).toContain('cacheLife("minutes")');
    expect(getSource).toContain("export const memberHistoryIds = Object.keys(dummyMemberHistory);");
    expect(getSource).toContain("Object.hasOwn(dummyMemberHistory, id)");
    expect(getSource).toContain(
      "TODO: connect backend via lib/api-client.ts (GET /coach/members/[id]/history?page=N) — dummy for now"
    );
    expect(getSource).not.toContain('"use client"');
  });
});
