import { describe, expect, it } from "vitest";
import type { AuthUser, Dashboard } from "@/api";
import { zDashboard } from "@/api/zod.gen";
import {
  toCoachNoteViewModel,
  toGreetingViewModel,
  toHeroMetricViewModel,
  toLastSessionViewModel,
  toMemberDashboardViewModel,
  toPillarStatsViewModel,
  toWeeklyDataViewModel,
} from "@/features/member/data/dashboard-mapper";

const sampleUser: AuthUser = {
  id: "usr-1",
  fullName: "Aced Suryana",
  identifier: "2307051",
  role: "member",
};

const populatedDashboard: Dashboard = zDashboard.parse({
  statistics: {
    completedSessionCount: 24,
    totalDurationSeconds: 31500, // 8h 45m
    durationSampleCount: 24,
    scoredSessionCount: 18,
    excludedScoreCount: 0,
    similarityGroups: [
      {
        movementSlug: "kuda-kuda",
        method: "static-reference-pose",
        analyzerVersion: "1.0",
        featureVersion: "1.0",
        referenceVersion: "1.0",
        averageScore: 94.8,
        sampleCount: 8,
      },
      {
        movementSlug: "pukulan",
        method: "static-reference-pose",
        analyzerVersion: "1.0",
        featureVersion: "1.0",
        referenceVersion: "1.0",
        averageScore: 82.0,
        sampleCount: 6,
      },
      {
        movementSlug: "tangkisan",
        method: "static-reference-pose",
        analyzerVersion: "1.0",
        featureVersion: "1.0",
        referenceVersion: "1.0",
        averageScore: 89.5,
        sampleCount: 4,
      },
      {
        movementSlug: "tendangan",
        method: "static-reference-pose",
        analyzerVersion: "1.0",
        featureVersion: "1.0",
        referenceVersion: "1.0",
        averageScore: 76.0,
        sampleCount: 2,
      },
    ],
  },
  lastSession: {
    session: {
      id: "sess-101",
      movementSlug: "pukulan",
      createdAt: "2026-11-05T09:40:00Z",
      uploadedAt: "2026-11-05T09:40:10Z",
      startedAt: "2026-11-05T09:40:00Z",
      completedAt: "2026-11-05T09:41:00Z",
      processingStatus: "completed",
      analysisStatus: "experimental",
      evaluationId: "eval-101",
      reviewStatus: "needs_revision",
      reviewAvailable: true,
      retryOf: null,
      acknowledgedAt: null,
      error: null,
      media: {
        status: "available",
        expiresAt: "2026-11-06T09:40:00Z",
        mimeType: "video/webm",
        byteSize: 2048000,
        durationSeconds: 45,
        width: 1280,
        height: 720,
        playbackPath: "/api/v1/member/sessions/sess-101/video",
      },
    },
    movementName: "Pukulan Lurus (Serangan Tangan)",
    score: 82.4,
    scoreReason: null,
    review: {
      id: "rev-101",
      revision: 1,
      author: {
        id: "coach-1",
        fullName: "Kang Fauzan",
        title: "Pelatih Utama",
      },
      publishedAt: "2026-11-05T11:00:00Z",
      decision: "needs_revision",
      note: "Pertahankan garis lurus dari bahu ke buku jari.",
      bodyAssessments: [
        {
          bodyPart: "kuda_kuda_kaki",
          status: "approved",
          note: "Pusat gravitasi stabil saat melepaskan serangan.",
        },
        {
          bodyPart: "siku_kanan",
          status: "needs_revision",
          note: "Siku kanan turun saat pelepasan pukulan.",
        },
      ],
      taskIds: [],
      supersedesReviewId: null,
    },
  },
  latestCoachNote: {
    id: "note-1",
    author: {
      id: "coach-1",
      fullName: "Kang Fauzan",
      title: "Pelatih Utama",
    },
    text: "Postur kuda-kuda Aced sudah kokoh. Tingkatkan akselerasi pelepasan pukulan tanpa menurunkan siku pelindung.",
    publishedAt: "2026-11-06T08:00:00Z",
  },
  coach: {
    id: "coach-1",
    fullName: "Kang Fauzan",
    title: "Pelatih Utama",
  },
  dominantMovementSlug: "pukulan",
  weeklyActivity: [
    { date: "2026-11-02", sessionCount: 2, durationSeconds: 90 },
    { date: "2026-11-03", sessionCount: 4, durationSeconds: 180 },
    { date: "2026-11-04", sessionCount: 0, durationSeconds: 0 },
    { date: "2026-11-05", sessionCount: 3, durationSeconds: 135 },
    { date: "2026-11-06", sessionCount: 0, durationSeconds: 0 },
    { date: "2026-11-07", sessionCount: 0, durationSeconds: 0 },
    { date: "2026-11-08", sessionCount: 0, durationSeconds: 0 },
  ],
  timezone: "Asia/Jakarta",
});

const emptyDashboard: Dashboard = zDashboard.parse({
  statistics: {
    completedSessionCount: 0,
    totalDurationSeconds: 0,
    durationSampleCount: 0,
    scoredSessionCount: 0,
    excludedScoreCount: 0,
    similarityGroups: [],
  },
  lastSession: null,
  latestCoachNote: null,
  coach: null,
  dominantMovementSlug: null,
  weeklyActivity: [],
  timezone: "Asia/Jakarta",
});

describe("dashboard-mapper", () => {
  it("maps greeting with first name from AuthUser, recency in Asia/Jakarta, and dominant focus", () => {
    const now = new Date("2026-11-07T04:00:00Z"); // 2026-11-07 in Asia/Jakarta
    const greeting = toGreetingViewModel(populatedDashboard, sampleUser, now);

    expect(greeting).toEqual({
      name: "Aced",
      lastSessionDaysAgo: 2,
      lastSessionRecencyLabel: "Sesi latihan mandiri terakhirmu 2 hari lalu.",
      focusSlug: "pukulan",
      focusTechnique: "Pukulan Lurus",
      hasRecordedSession: true,
    });
  });

  it("maps heroMetric with similarity points and honest Segera hadir flags", () => {
    const metric = toHeroMetricViewModel(populatedDashboard);

    expect(metric.statusLabel).toBe("Sesi Terakhir Dinilai");
    expect(metric.statusVariant).toBe("success");
    expect(metric.scoreAvailable).toBe(true);
    expect(metric.scoreLabel).toBe("82 poin");
    expect(metric.completedSessionsLabel).toBe("24 Sesi Selesai");
    expect(metric.totalDurationLabel).toBe("08j 45m");
    expect(metric.compositeAccuracy).toEqual({ available: false, label: "Segera hadir" });
    expect(metric.sensorTelemetry).toEqual({ available: false, label: "Segera hadir" });
  });

  it("maps four pillars in canonical order with similarity points and active focus card", () => {
    const pillars = toPillarStatsViewModel(populatedDashboard);

    expect(pillars.map((p) => p.slug)).toEqual([
      "kuda-kuda",
      "pukulan",
      "tangkisan",
      "tendangan",
    ]);
    expect(pillars.filter((p) => p.active).map((p) => p.slug)).toEqual(["pukulan"]);
    expect(pillars[0].avgLabel).toContain("poin");
    expect(pillars[1].status).toBe("perlu-koreksi");
    expect(pillars[1].href).toBe("/latihan/pukulan");
  });

  it("Withholds numeric pillar average when multiple incompatible SimilarityGroups exist", () => {
    const multiGroupDashboard: Dashboard = {
      ...populatedDashboard,
      statistics: {
        ...populatedDashboard.statistics,
        similarityGroups: [
          {
            movementSlug: "kuda-kuda",
            method: "static-reference-pose",
            analyzerVersion: "1.0",
            featureVersion: "1.0",
            referenceVersion: "1.0",
            averageScore: 90,
            sampleCount: 4,
          },
          {
            movementSlug: "kuda-kuda",
            method: "static-reference-pose",
            analyzerVersion: "2.0",
            featureVersion: "2.0",
            referenceVersion: "2.0",
            averageScore: 80,
            sampleCount: 3,
          },
        ],
      },
    };

    const pillars = toPillarStatsViewModel(multiGroupDashboard);
    const kudaKuda = pillars.find((p) => p.slug === "kuda-kuda")!;

    expect(kudaKuda.scoreAvailable).toBe(false);
    expect(kudaKuda.avgLabel).toBe("Segera hadir");
    expect(kudaKuda.detail).toBe("7 sesi dinilai");
  });

  it("maps lastSession observations from published coach review and marks reps Segera hadir", () => {
    const lastSession = toLastSessionViewModel(populatedDashboard.lastSession);

    expect(lastSession).not.toBeNull();
    expect(lastSession!.id).toBe("sess-101");
    expect(lastSession!.badgeLabel).toBe("82 poin — Perlu Revisi");
    expect(lastSession!.durationLabel).toBe("45 detik");
    expect(lastSession!.reps).toEqual({ available: false, label: "Segera hadir" });
    expect(lastSession!.observations).toHaveLength(3);
    expect(lastSession!.observations.map((o) => o.tone)).toEqual(["good", "warning", "neutral"]);
    expect(lastSession!.retryHref).toBe("/latihan/pukulan/rekam");
    expect(lastSession!.detailHref).toBe("/riwayat/sess-101");
  });

  it("normalizes 7-day weeklyActivity with session counts and highlights latest active day", () => {
    const weekly = toWeeklyDataViewModel(
      populatedDashboard,
      new Date("2026-11-07T04:00:00Z"),
    );

    expect(weekly.days).toHaveLength(7);
    expect(weekly.days.map((d) => [d.label, d.state, d.valueLabel])).toEqual([
      ["Sen", "filled", "2x"],
      ["Sel", "filled", "4x"],
      ["Rab", "empty", "-"],
      ["Kam", "active", "3x"],
      ["Jum", "empty", "-"],
      ["Sab", "empty", "-"],
      ["Min", "empty", "-"],
    ]);
    expect(weekly.targetLabel).toBe("3 dari 7 hari aktif • 9 sesi");
    expect(weekly.targetConfig).toEqual({ available: false, label: "Segera hadir" });
  });

  it("handles zero-session new member dashboard safely without crashing", () => {
    const vm = toMemberDashboardViewModel(
      emptyDashboard,
      null,
      new Date("2026-11-07T04:00:00Z"),
    );

    expect(vm.greeting.name).toBe("Pesilat");
    expect(vm.greeting.lastSessionDaysAgo).toBeNull();
    expect(vm.greeting.hasRecordedSession).toBe(false);
    expect(vm.heroMetric.scoreAvailable).toBe(false);
    expect(vm.heroMetric.scoreLabel).toBe("Belum dinilai");
    expect(vm.lastSession).toBeNull();
    expect(vm.weekly.days).toHaveLength(7);
    expect(vm.coachNote).toEqual({
      available: false,
      initials: "—",
      name: "Pelatih Belum Ditugaskan",
      quote: "Belum ada catatan dari pelatih.",
    });
  });

  it("falls back to lastSession.review.note when latestCoachNote is null", () => {
    const note = toCoachNoteViewModel({
      ...populatedDashboard,
      latestCoachNote: null,
    });

    expect(note.available).toBe(true);
    expect(note.name).toBe("Kang Fauzan");
    expect(note.initials).toBe("KF");
    expect(note.quote).toBe("Pertahankan garis lurus dari bahu ke buku jari.");
  });
});
