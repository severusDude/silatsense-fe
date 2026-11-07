import { describe, expect, it } from "vitest";
import type { Dashboard, HistoryItem, HistoryPage } from "@/api";
import {
  toHistoryEntryViewModel,
  toHistoryPageViewModel,
  toHistorySummaryViewModel,
} from "@/features/member/data/history-mapper";
import { historyFilterQuerySchema } from "@/features/member/schemas/history";

describe("history mapper - summary stats", () => {
  it("maps Dashboard statistics into honest summary ViewModel", () => {
    const mockDashboard: Dashboard = {
      statistics: {
        completedSessionCount: 24,
        totalDurationSeconds: 31500, // 8h 45m
        durationSampleCount: 24,
        scoredSessionCount: 18,
        excludedScoreCount: 0,
        similarityGroups: [
          {
            movementSlug: "kuda-kuda",
            method: "static-pose",
            analyzerVersion: "1.0",
            featureVersion: "1.0",
            referenceVersion: "1.0",
            averageScore: 82.5,
            sampleCount: 12,
          },
        ],
      },
      lastSession: null,
      latestCoachNote: null,
      dominantMovementSlug: "kuda-kuda",
      weeklyActivity: [],
    };

    const summary = toHistorySummaryViewModel(mockDashboard);

    expect(summary.totalSessionsLabel).toBe("24 Sesi");
    expect(summary.sessionsDeltaLabel).toBe("Segera hadir");
    expect(summary.accuracy.available).toBe(false);
    expect(summary.accuracy.label).toBe("Segera hadir");
    expect(summary.dominantFocusLabel).toBe("Kuda-kuda");
    expect(summary.dominantSessionsLabel).toBe("12 sesi dinilai");
    expect(summary.durationHoursLabel).toBe("08j 45m");
    expect(summary.durationNoteLabel).toBe("24 sampel durasi");
  });

  it("handles null dominant movement slug gracefully", () => {
    const mockDashboard: Dashboard = {
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
      dominantMovementSlug: null,
      weeklyActivity: [],
    };

    const summary = toHistorySummaryViewModel(mockDashboard);

    expect(summary.totalSessionsLabel).toBe("0 Sesi");
    expect(summary.dominantFocusLabel).toBe("Belum ada");
    expect(summary.dominantSessionsLabel).toBe("0 sesi dinilai");
    expect(summary.durationHoursLabel).toBe("00j 00m");
  });
});

describe("history mapper - session list items", () => {
  it("maps HistoryItem with score in points without percentage", () => {
    const mockItem: HistoryItem = {
      session: {
        id: "sess-1",
        movementSlug: "pukulan",
        processingStatus: "completed",
        reviewStatus: "approved",
        startedAt: "2026-09-28T09:45:00Z",
        uploadedAt: "2026-09-28T09:45:30Z",
        completedAt: "2026-09-28T09:46:00Z",
        createdAt: "2026-09-28T09:44:00Z",
        analysisStatus: "completed",
        evaluationId: "eval-1",
        media: {
          status: "available",
          mimeType: "video/webm",
          width: 1280,
          height: 720,
          durationSeconds: 15,
          byteSize: 1000000,
          playbackPath: "/api/member/sessions/sess-1/video",
          expiresAt: "2026-09-29T09:45:00Z",
        },
        error: null,
        acknowledgedAt: null,
        retryOf: null,
      },
      movementName: "Pukulan Lurus",
      score: 80.4,
      scoreReason: "Sudut siku sesuai referensi.",
      review: {
        id: "rev-1",
        revision: 1,
        author: { id: "c-1", fullName: "Kang Fauzan", title: "Pelatih Utama" },
        publishedAt: "2026-09-28T10:00:00Z",
        decision: "approved",
        note: "Gerakan rapi dan stabil.",
        bodyAssessments: [
          { bodyPart: "siku_kanan", status: "approved", note: "Posisi mantap." },
        ],
        taskIds: [],
        supersedesReviewId: null,
      },
    };

    const entry = toHistoryEntryViewModel(mockItem);

    expect(entry.id).toBe("sess-1");
    expect(entry.slug).toBe("pukulan");
    expect(entry.techniqueName).toBe("Pukulan Lurus");
    expect(entry.status).toBe("sesuai");
    expect(entry.statusLabel).toBe("Disetujui");
    expect(entry.scoreAvailable).toBe(true);
    expect(entry.scoreLabel).toBe("80 poin");
    expect(entry.scoreCaption).toBe("Skor Kemiripan");
    expect(entry.params.length).toBe(1);
    expect(entry.params[0].name).toBe("Siku Kanan");
    expect(entry.params[0].status).toBe("sesuai");
    expect(entry.coachNote).toBe("Gerakan rapi dan stabil.");
    expect(entry.hasPublishedReview).toBe(true);
  });

  it("maps unreviewed / unscored session safely", () => {
    const mockItem: HistoryItem = {
      session: {
        id: "sess-2",
        movementSlug: "kuda-kuda",
        processingStatus: "completed",
        reviewStatus: "pending",
        startedAt: "2026-09-28T09:45:00Z",
        uploadedAt: "2026-09-28T09:45:30Z",
        completedAt: "2026-09-28T09:46:00Z",
        createdAt: "2026-09-28T09:44:00Z",
        analysisStatus: "completed",
        evaluationId: "eval-1",
        media: {
          status: "available",
          mimeType: "video/webm",
          width: 1280,
          height: 720,
          durationSeconds: 15,
          byteSize: 1000000,
          playbackPath: "/api/member/sessions/sess-1/video",
          expiresAt: "2026-09-29T09:45:00Z",
        },
        error: null,
        acknowledgedAt: null,
        retryOf: null,
      },
      movementName: "",
      score: null,
      scoreReason: null,
      review: null,
    };

    const entry = toHistoryEntryViewModel(mockItem);

    expect(entry.id).toBe("sess-2");
    expect(entry.techniqueName).toBe("Kuda-kuda");
    expect(entry.status).toBe("menunggu");
    expect(entry.statusLabel).toBe("Menunggu Ulasan");
    expect(entry.scoreAvailable).toBe(false);
    expect(entry.scoreLabel).toBe("—");
    expect(entry.scoreCaption).toBe("Belum dinilai");
    expect(entry.params).toEqual([]);
    expect(entry.coachNote).toBeNull();
    expect(entry.hasPublishedReview).toBe(false);
  });

  it("maps HistoryPage pagination cursor", () => {
    const page: HistoryPage = {
      items: [],
      nextCursor: "cursor-token-xyz",
    };
    const filters = {
      movementSlug: null,
      reviewStatus: null,
      processingStatus: null,
      cursor: null,
      limit: 20,
    };

    const result = toHistoryPageViewModel(page, filters);
    expect(result.items).toEqual([]);
    expect(result.nextCursor).toBe("cursor-token-xyz");
    expect(result.filters).toEqual(filters);
  });
});

describe("historyFilterQuerySchema", () => {
  it("provides clean defaults for empty search params", () => {
    const parsed = historyFilterQuerySchema.parse({});
    expect(parsed.movementSlug).toBeNull();
    expect(parsed.reviewStatus).toBeNull();
    expect(parsed.processingStatus).toBeNull();
    expect(parsed.cursor).toBeNull();
    expect(parsed.limit).toBe(20);
  });

  it("sanitizes invalid slugs and statuses to null", () => {
    const parsed = historyFilterQuerySchema.parse({
      movementSlug: "invalid-slug",
      reviewStatus: "unknown-status",
      limit: 50,
    });
    expect(parsed.movementSlug).toBeNull();
    expect(parsed.reviewStatus).toBeNull();
    expect(parsed.limit).toBe(50);
  });
});
