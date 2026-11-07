import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Dashboard } from "@/api";

vi.mock("server-only", () => ({}));

const mockDashboardGet = vi.fn();
const mockGetAccessToken = vi.fn();
const mockGetSession = vi.fn();

vi.mock("@/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api")>();
  return {
    ...actual,
    dashboardApiV1MemberDashboardGet: (...args: unknown[]) =>
      mockDashboardGet(...args),
  };
});

vi.mock("@/features/auth/data/session", () => ({
  getAccessToken: () => mockGetAccessToken(),
  getSession: () => mockGetSession(),
}));

const sampleDashboard: Dashboard = {
  statistics: {
    completedSessionCount: 10,
    totalDurationSeconds: 3600,
    durationSampleCount: 10,
    scoredSessionCount: 8,
    excludedScoreCount: 0,
    similarityGroups: [
      {
        movementSlug: "pukulan",
        method: "static-reference-pose",
        analyzerVersion: "1.0",
        featureVersion: "1.0",
        referenceVersion: "1.0",
        averageScore: 82.0,
        sampleCount: 8,
      },
    ],
  },
  lastSession: null,
  latestCoachNote: null,
  coach: {
    id: "coach-1",
    fullName: "Kang Fauzan",
    title: "Pelatih Utama",
  },
  dominantMovementSlug: "pukulan",
  weeklyActivity: [],
  timezone: "Asia/Jakarta",
};

describe("getMemberDashboard & getDashboardSummary", () => {
  beforeEach(() => {
    vi.resetModules();
    mockDashboardGet.mockReset();
    mockGetAccessToken.mockReset();
    mockGetSession.mockReset();
  });

  it("returns null when no access token is present", async () => {
    mockGetAccessToken.mockResolvedValue(undefined);
    mockGetSession.mockResolvedValue(null);

    const { getMemberDashboard } = await import(
      "@/features/member/data/get-member-dashboard"
    );
    const result = await getMemberDashboard();

    expect(result).toBeNull();
    expect(mockDashboardGet).not.toHaveBeenCalled();
  });

  it("returns null on 401 unauthorized response", async () => {
    mockGetAccessToken.mockResolvedValue("expired-token");
    mockGetSession.mockResolvedValue(null);
    mockDashboardGet.mockResolvedValue({
      data: undefined,
      error: { detail: "Unauthorized" },
      response: new Response(null, { status: 401 }),
    });

    const { getMemberDashboard } = await import(
      "@/features/member/data/get-member-dashboard"
    );
    const result = await getMemberDashboard();

    expect(result).toBeNull();
  });

  it("throws an Error on 500 server failure instead of silently returning null", async () => {
    mockGetAccessToken.mockResolvedValue("valid-token");
    mockGetSession.mockResolvedValue(null);
    mockDashboardGet.mockResolvedValue({
      data: undefined,
      error: { detail: "Database unavailable" },
      response: new Response(null, { status: 500 }),
    });

    const { getMemberDashboard } = await import(
      "@/features/member/data/get-member-dashboard"
    );

    await expect(getMemberDashboard()).rejects.toThrow(
      /Gagal mengambil data dasbor member/,
    );
  });

  it("validates wire response with Zod and maps Dashboard + AuthUser to MemberDashboardViewModel", async () => {
    mockGetAccessToken.mockResolvedValue("valid-token");
    mockGetSession.mockResolvedValue({
      id: "usr-1",
      fullName: "Aced Suryana",
      identifier: "2307051",
      role: "member",
    });
    mockDashboardGet.mockResolvedValue({
      data: sampleDashboard,
      error: undefined,
      response: new Response(null, { status: 200 }),
    });

    const { getMemberDashboard } = await import(
      "@/features/member/data/get-member-dashboard"
    );
    const result = await getMemberDashboard();

    expect(result).not.toBeNull();
    expect(result!.greeting.name).toBe("Aced");
    expect(result!.greeting.focusSlug).toBe("pukulan");
    expect(result!.heroMetric.completedSessionsLabel).toBe("10 Sesi Selesai");
    expect(result!.coachNote.name).toBe("Kang Fauzan");
    expect(mockDashboardGet).toHaveBeenCalledWith({
      headers: { Authorization: "Bearer valid-token" },
      cache: "no-store",
      throwOnError: false,
    });
  });
});
