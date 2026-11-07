import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CoachOverview as CoachOverviewDto, RosterPage } from "@/api";

vi.mock("server-only", () => ({}));

const mockOverviewGet = vi.fn();
const mockRosterGet = vi.fn();
const mockGetAccessToken = vi.fn();

vi.mock("@/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api")>();
  return {
    ...actual,
    overviewApiV1CoachOverviewGet: (...args: unknown[]) => mockOverviewGet(...args),
    rosterApiV1CoachRosterGet: (...args: unknown[]) => mockRosterGet(...args),
  };
});

vi.mock("@/features/auth/data/session", () => ({
  getAccessToken: () => mockGetAccessToken(),
}));

const sampleOverview: CoachOverviewDto = {
  memberCount: 3,
  reviewQueueCount: 1,
  statistics: {
    completedSessionCount: 15,
    totalDurationSeconds: 1800,
    durationSampleCount: 15,
    scoredSessionCount: 12,
    excludedScoreCount: 0,
    similarityGroups: [
      {
        movementSlug: "kuda-kuda",
        method: "static-reference-pose",
        analyzerVersion: "1.0",
        featureVersion: "1.0",
        referenceVersion: "1.0",
        averageScore: 92.5,
        sampleCount: 5,
      },
    ],
  },
  recentSessions: [],
  topIssues: [
    {
      feature: "sudut_lutut",
      sessionCount: 4,
    },
  ],
};

const sampleRoster: RosterPage = {
  items: [
    {
      profile: {
        id: "ath-1",
        role: "member",
        fullName: "Rian Mahendra",
        npm: "2307001",
        email: "rian@example.com",
        emailVerifiedAt: null,
        division: "Tanding",
        title: null,
        belt: "Hijau",
        beltTarget: "Putih",
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

describe("coach-dashboard-data readers", () => {
  beforeEach(() => {
    vi.resetModules();
    mockOverviewGet.mockReset();
    mockRosterGet.mockReset();
    mockGetAccessToken.mockReset();
  });

  describe("getCoachOverviewDto", () => {
    it("returns null when access token is missing", async () => {
      mockGetAccessToken.mockResolvedValue(undefined);

      const { getCoachOverviewDto } = await import(
        "@/features/coach/data/get-coach-overview"
      );
      const result = await getCoachOverviewDto();

      expect(result).toBeNull();
      expect(mockOverviewGet).not.toHaveBeenCalled();
    });

    it("returns null on 401 response", async () => {
      mockGetAccessToken.mockResolvedValue("expired-token");
      mockOverviewGet.mockResolvedValue({
        data: undefined,
        error: { detail: "Unauthorized" },
        response: new Response(null, { status: 401 }),
      });

      const { getCoachOverviewDto } = await import(
        "@/features/coach/data/get-coach-overview"
      );
      const result = await getCoachOverviewDto();

      expect(result).toBeNull();
    });

    it("throws descriptive Error on 500 failure", async () => {
      mockGetAccessToken.mockResolvedValue("valid-token");
      mockOverviewGet.mockResolvedValue({
        data: undefined,
        error: { detail: "Internal Server Error" },
        response: new Response(null, { status: 500 }),
      });

      const { getCoachOverviewDto } = await import(
        "@/features/coach/data/get-coach-overview"
      );

      await expect(getCoachOverviewDto()).rejects.toThrow(
        /Failed to fetch coach overview \(status: 500\)/,
      );
    });

    it("sends Bearer header, cache: no-store, throwOnError: false", async () => {
      mockGetAccessToken.mockResolvedValue("valid-token");
      mockOverviewGet.mockResolvedValue({
        data: sampleOverview,
        error: undefined,
        response: new Response(null, { status: 200 }),
      });

      const { getCoachOverviewDto } = await import(
        "@/features/coach/data/get-coach-overview"
      );
      const result = await getCoachOverviewDto();

      expect(result).toEqual(sampleOverview);
      expect(mockOverviewGet).toHaveBeenCalledWith({
        headers: { Authorization: "Bearer valid-token" },
        cache: "no-store",
        throwOnError: false,
      });
    });

    it("throws when data fails Zod validation", async () => {
      mockGetAccessToken.mockResolvedValue("valid-token");
      mockOverviewGet.mockResolvedValue({
        data: { invalid: "shape" },
        error: undefined,
        response: new Response(null, { status: 200 }),
      });

      const { getCoachOverviewDto } = await import(
        "@/features/coach/data/get-coach-overview"
      );

      await expect(getCoachOverviewDto()).rejects.toThrow();
    });
  });

  describe("getCoachRosterDto", () => {
    it("returns null when access token is missing", async () => {
      mockGetAccessToken.mockResolvedValue(undefined);

      const { getCoachRosterDto } = await import(
        "@/features/coach/data/get-coach-overview"
      );
      const result = await getCoachRosterDto();

      expect(result).toBeNull();
      expect(mockRosterGet).not.toHaveBeenCalled();
    });

    it("returns null on 401 response", async () => {
      mockGetAccessToken.mockResolvedValue("expired-token");
      mockRosterGet.mockResolvedValue({
        data: undefined,
        error: { detail: "Unauthorized" },
        response: new Response(null, { status: 401 }),
      });

      const { getCoachRosterDto } = await import(
        "@/features/coach/data/get-coach-overview"
      );
      const result = await getCoachRosterDto();

      expect(result).toBeNull();
    });

    it("throws descriptive Error on 500 failure", async () => {
      mockGetAccessToken.mockResolvedValue("valid-token");
      mockRosterGet.mockResolvedValue({
        data: undefined,
        error: { detail: "Server error" },
        response: new Response(null, { status: 500 }),
      });

      const { getCoachRosterDto } = await import(
        "@/features/coach/data/get-coach-overview"
      );

      await expect(getCoachRosterDto()).rejects.toThrow(
        /Failed to fetch coach roster \(status: 500\)/,
      );
    });

    it("sends query: { limit: 5 }, Bearer header, cache: no-store, throwOnError: false", async () => {
      mockGetAccessToken.mockResolvedValue("valid-token");
      mockRosterGet.mockResolvedValue({
        data: sampleRoster,
        error: undefined,
        response: new Response(null, { status: 200 }),
      });

      const { getCoachRosterDto } = await import(
        "@/features/coach/data/get-coach-overview"
      );
      const result = await getCoachRosterDto();

      expect(result).toEqual(sampleRoster);
      expect(mockRosterGet).toHaveBeenCalledWith({
        query: { limit: 5 },
        headers: { Authorization: "Bearer valid-token" },
        cache: "no-store",
        throwOnError: false,
      });
    });

    it("throws when data fails Zod validation", async () => {
      mockGetAccessToken.mockResolvedValue("valid-token");
      mockRosterGet.mockResolvedValue({
        data: { items: "not-an-array" },
        error: undefined,
        response: new Response(null, { status: 200 }),
      });

      const { getCoachRosterDto } = await import(
        "@/features/coach/data/get-coach-overview"
      );

      await expect(getCoachRosterDto()).rejects.toThrow();
    });
  });

  describe("getCoachDashboard", () => {
    it("returns null when overview returns null", async () => {
      mockGetAccessToken.mockResolvedValue("token");
      mockOverviewGet.mockResolvedValue({
        data: undefined,
        error: { detail: "Unauthorized" },
        response: new Response(null, { status: 401 }),
      });
      mockRosterGet.mockResolvedValue({
        data: sampleRoster,
        error: undefined,
        response: new Response(null, { status: 200 }),
      });

      const { getCoachDashboard } = await import(
        "@/features/coach/data/get-coach-overview"
      );
      const result = await getCoachDashboard();

      expect(result).toBeNull();
    });

    it("still maps stats/pillars/posture when roster returns null", async () => {
      mockGetAccessToken.mockResolvedValue("token");
      mockOverviewGet.mockResolvedValue({
        data: sampleOverview,
        error: undefined,
        response: new Response(null, { status: 200 }),
      });
      mockRosterGet.mockResolvedValue({
        data: undefined,
        error: { detail: "Unauthorized" },
        response: new Response(null, { status: 401 }),
      });

      const { getCoachDashboard } = await import(
        "@/features/coach/data/get-coach-overview"
      );
      const result = await getCoachDashboard();

      expect(result).not.toBeNull();
      expect(result!.memberCount).toBe(3);
      expect(result!.athletes).toEqual([]);
      expect(result!.athleteCountLabel).toBe("0 dari 3 Atlet");
      expect(result!.stats).toHaveLength(4);
      expect(result!.pillars).toHaveLength(4);
      expect(result!.posture).toHaveLength(1);
    });

    it("maps both overview and roster when both succeed", async () => {
      mockGetAccessToken.mockResolvedValue("token");
      mockOverviewGet.mockResolvedValue({
        data: sampleOverview,
        error: undefined,
        response: new Response(null, { status: 200 }),
      });
      mockRosterGet.mockResolvedValue({
        data: sampleRoster,
        error: undefined,
        response: new Response(null, { status: 200 }),
      });

      const { getCoachDashboard } = await import(
        "@/features/coach/data/get-coach-overview"
      );
      const result = await getCoachDashboard();

      expect(result).not.toBeNull();
      expect(result!.athletes).toHaveLength(1);
      expect(result!.athletes[0].name).toBe("Rian Mahendra");
      expect(result!.athleteCountLabel).toBe("1 dari 3 Atlet");
    });
  });
});
