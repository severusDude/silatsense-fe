import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mockOverviewGet = vi.fn();
const mockRosterGet = vi.fn();
const mockMemberDetailGet = vi.fn();
const mockSessionDetailGet = vi.fn();
const mockMemberSessionsGet = vi.fn();
const mockGetAccessToken = vi.fn();

vi.mock("@/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api")>();
  return {
    ...actual,
    overviewApiV1CoachOverviewGet: (...args: unknown[]) =>
      mockOverviewGet(...args),
    rosterApiV1CoachRosterGet: (...args: unknown[]) => mockRosterGet(...args),
    memberDetailApiV1CoachRosterMemberIdGet: (...args: unknown[]) =>
      mockMemberDetailGet(...args),
    sessionDetailApiV1CoachSessionsSessionIdGet: (...args: unknown[]) =>
      mockSessionDetailGet(...args),
    memberSessionsApiV1CoachRosterMemberIdSessionsGet: (...args: unknown[]) =>
      mockMemberSessionsGet(...args),
  };
});

vi.mock("@/features/auth/data/session", () => ({
  getAccessToken: () => mockGetAccessToken(),
}));

const validOverview = {
  memberCount: 5,
  reviewQueueCount: 1,
  statistics: {
    completedSessionCount: 8,
    totalDurationSeconds: 1200,
    durationSampleCount: 8,
    scoredSessionCount: 6,
    excludedScoreCount: 0,
    similarityGroups: [],
  },
  recentSessions: [],
  topIssues: [],
};

const validRoster = {
  items: [
    {
      profile: {
        id: "mem-1",
        role: "member",
        fullName: "Budi Santoso",
        npm: "123456",
        email: "budi@example.com",
        emailVerifiedAt: null,
        division: "Tanding",
        title: null,
        belt: "Kuning",
        beltTarget: "Hijau",
        passwordChangedAt: null,
        coach: null,
        createdAt: "2026-01-01T00:00:00Z",
        statistics: null,
      },
      latestSession: null,
    },
  ],
  nextCursor: null,
};

const validMemberDetail = {
  profile: {
    id: "mem-1",
    role: "member",
    fullName: "Budi Santoso",
    npm: "123456",
    email: "budi@example.com",
    emailVerifiedAt: null,
    division: "Tanding",
    title: null,
    belt: "Kuning",
    beltTarget: "Hijau",
    passwordChangedAt: null,
    coach: null,
    createdAt: "2026-01-01T00:00:00Z",
    statistics: null,
  },
  latestSession: null,
  statistics: {
    totalSessions: 10,
    completedSessionCount: 8,
    totalDurationSeconds: 1200,
    durationSampleCount: 8,
    scoredSessionCount: 6,
    excludedScoreCount: 0,
    similarityGroups: [],
  },
};

const validHistoryPage = {
  items: [],
  nextCursor: null,
};

describe("coach members data readers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAccessToken.mockResolvedValue("test-token");
  });

  describe("get-team-members.ts", () => {
    it("fetches overview with Bearer token, cache: no-store, throwOnError: false", async () => {
      mockOverviewGet.mockResolvedValue({
        data: validOverview,
        error: null,
        response: new Response(null, { status: 200 }),
      });

      const { getCoachOverviewDto } = await import(
        "@/features/coach/data/get-team-members"
      );
      const result = await getCoachOverviewDto();

      expect(result).toEqual(validOverview);
      expect(mockOverviewGet).toHaveBeenCalledWith({
        headers: { Authorization: "Bearer test-token" },
        cache: "no-store",
        throwOnError: false,
      });
    });

    it("returns null when unauthenticated or 401", async () => {
      mockGetAccessToken.mockResolvedValueOnce(null);
      const { getCoachOverviewDto } = await import(
        "@/features/coach/data/get-team-members"
      );
      expect(await getCoachOverviewDto()).toBeNull();

      mockGetAccessToken.mockResolvedValueOnce("token");
      mockOverviewGet.mockResolvedValueOnce({
        data: null,
        error: "Unauthorized",
        response: new Response(null, { status: 401 }),
      });
      expect(await getCoachOverviewDto()).toBeNull();
    });

    it("throws on 500 or Zod error", async () => {
      mockOverviewGet.mockResolvedValueOnce({
        data: null,
        error: "Server Error",
        response: new Response(null, { status: 500 }),
      });
      const { getCoachOverviewDto } = await import(
        "@/features/coach/data/get-team-members"
      );
      await expect(getCoachOverviewDto()).rejects.toThrow("Failed to fetch coach overview");

      mockOverviewGet.mockResolvedValueOnce({
        data: { invalid: true },
        error: null,
        response: new Response(null, { status: 200 }),
      });
      await expect(getCoachOverviewDto()).rejects.toThrow();
    });

    it("fetches roster with clamped limit and query params", async () => {
      mockRosterGet.mockResolvedValue({
        data: validRoster,
        error: null,
        response: new Response(null, { status: 200 }),
      });

      const { getCoachRosterDto } = await import(
        "@/features/coach/data/get-team-members"
      );
      const result = await getCoachRosterDto({
        limit: 500, // should clamp to 100
        cursor: "cur-1",
        q: "ahmad",
      });

      expect(result).toEqual(validRoster);
      expect(mockRosterGet).toHaveBeenCalledWith({
        query: {
          limit: 100,
          cursor: "cur-1",
          q: "ahmad",
        },
        headers: { Authorization: "Bearer test-token" },
        cache: "no-store",
        throwOnError: false,
      });
    });

    it("getCoachMembersPage returns null if overview fails", async () => {
      mockOverviewGet.mockResolvedValueOnce({
        data: null,
        error: "Unauthorized",
        response: new Response(null, { status: 401 }),
      });
      mockRosterGet.mockResolvedValueOnce({
        data: validRoster,
        error: null,
        response: new Response(null, { status: 200 }),
      });

      const { getCoachMembersPage } = await import(
        "@/features/coach/data/get-team-members"
      );
      const page = await getCoachMembersPage({ q: "" });
      expect(page).toBeNull();
    });

    it("getCoachMembersPage maps stats and empty roster if roster is null", async () => {
      mockOverviewGet.mockResolvedValueOnce({
        data: validOverview,
        error: null,
        response: new Response(null, { status: 200 }),
      });
      mockRosterGet.mockResolvedValueOnce({
        data: null,
        error: "Unauthorized",
        response: new Response(null, { status: 401 }),
      });

      const { getCoachMembersPage } = await import(
        "@/features/coach/data/get-team-members"
      );
      const page = await getCoachMembersPage();
      expect(page).not.toBeNull();
      expect(page?.stats).toHaveLength(4);
      expect(page?.members).toEqual([]);
    });
  });

  describe("get-member-detail.ts", () => {
    it("returns null on 404 for member detail and session detail", async () => {
      mockMemberDetailGet.mockResolvedValueOnce({
        data: null,
        error: "Not Found",
        response: new Response(null, { status: 404 }),
      });

      const { getCoachMemberDetailDto, getCoachSessionDetailDto } =
        await import("@/features/coach/data/get-member-detail");

      expect(await getCoachMemberDetailDto("missing-id")).toBeNull();

      mockSessionDetailGet.mockResolvedValueOnce({
        data: null,
        error: "Not Found",
        response: new Response(null, { status: 404 }),
      });
      expect(await getCoachSessionDetailDto("missing-sess")).toBeNull();
    });

    it("fetches member detail and parallel sessions", async () => {
      mockMemberDetailGet.mockResolvedValueOnce({
        data: validMemberDetail,
        error: null,
        response: new Response(null, { status: 200 }),
      });
      mockMemberSessionsGet.mockResolvedValueOnce({
        data: validHistoryPage,
        error: null,
        response: new Response(null, { status: 200 }),
      });

      const { getCoachMemberDetail } = await import(
        "@/features/coach/data/get-member-detail"
      );
      const detailVm = await getCoachMemberDetail("mem-1");

      expect(detailVm).not.toBeNull();
      expect(detailVm?.profile.name).toBe("Budi Santoso");
      expect(detailVm?.evaluation.available).toBe(false);
      expect(mockMemberDetailGet).toHaveBeenCalledWith({
        path: { member_id: "mem-1" },
        headers: { Authorization: "Bearer test-token" },
        cache: "no-store",
        throwOnError: false,
      });
    });
  });

  describe("get-member-history.ts", () => {
    it("fetches member history and maps cursor page", async () => {
      mockMemberSessionsGet.mockResolvedValueOnce({
        data: validHistoryPage,
        error: null,
        response: new Response(null, { status: 200 }),
      });

      const { getCoachMemberHistory } = await import(
        "@/features/coach/data/get-member-history"
      );
      const historyPage = await getCoachMemberHistory("mem-1", { limit: 10 });

      expect(historyPage).not.toBeNull();
      expect(historyPage?.memberId).toBe("mem-1");
      expect(historyPage?.items).toEqual([]);
      expect(mockMemberSessionsGet).toHaveBeenCalledWith({
        path: { member_id: "mem-1" },
        query: {
          limit: 10,
          cursor: undefined,
          movementSlug: undefined,
          processingStatus: undefined,
          reviewStatus: undefined,
        },
        headers: { Authorization: "Bearer test-token" },
        cache: "no-store",
        throwOnError: false,
      });
    });
  });
});
