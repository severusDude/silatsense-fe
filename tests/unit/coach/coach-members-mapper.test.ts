import { describe, expect, it } from "vitest";
import {
  zCoachOverview,
  zCoachSessionDetail,
  zHistoryPage,
  zRosterDetail,
  zRosterPage,
} from "@/api/zod.gen";
import {
  toCoachMemberListItems,
  toCoachMemberPillars,
  toCoachMemberProfile,
  toCoachMemberStats,
  toCoachMemberStatus,
  toCoachMembersPageViewModel,
  toCoachMemberEvaluationViewModel,
  toCoachMemberHistoryPage,
  toCoachMemberDetailViewModel,
} from "@/features/coach/data/coach-members-mapper";

function createMockMedia() {
  return {
    status: "available" as const,
    expiresAt: null,
    mimeType: "video/webm",
    byteSize: 1024,
    durationSeconds: 15,
    width: 1280,
    height: 720,
    playbackPath: null,
  };
}

function createMockSession(overrides: Record<string, unknown> = {}) {
  return {
    id: "sess-1",
    movementSlug: "kuda-kuda" as const,
    createdAt: "2026-10-10T10:00:00Z",
    uploadedAt: null,
    startedAt: "2026-10-10T10:00:00Z",
    completedAt: "2026-10-10T10:05:00Z",
    processingStatus: "completed" as const,
    analysisStatus: null,
    evaluationId: "eval-1",
    reviewStatus: "approved" as const,
    reviewAvailable: true,
    retryOf: null,
    acknowledgedAt: null,
    error: null,
    media: createMockMedia(),
    ...overrides,
  };
}

function createMockProfile(overrides: Record<string, unknown> = {}) {
  return {
    id: "mem-1",
    role: "member" as const,
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
    ...overrides,
  };
}

function createMockActivitySummary(overrides: Record<string, unknown> = {}) {
  return {
    totalSessions: 10,
    completedSessionCount: 8,
    totalDurationSeconds: 1200,
    durationSampleCount: 8,
    scoredSessionCount: 6,
    excludedScoreCount: 0,
    similarityGroups: [],
    ...overrides,
  };
}

function createMockOverview(overrides: Record<string, unknown> = {}) {
  return zCoachOverview.parse({
    memberCount: 5,
    reviewQueueCount: 1,
    statistics: createMockActivitySummary(),
    recentSessions: [],
    topIssues: [],
    ...overrides,
  });
}

function createMockCoachIdentity(overrides: Record<string, unknown> = {}) {
  return {
    id: "coach-1",
    fullName: "Coach Bambang",
    title: "Pelatih Kepala",
    ...overrides,
  };
}

describe("coach-members-mapper", () => {
  describe("toCoachMemberStatus", () => {
    it("handles null latestSession (belum-ada)", () => {
      const res = toCoachMemberStatus(null, null);
      expect(res).toEqual({
        status: "belum-ada",
        label: "Belum Ada Sesi",
        variant: "outline",
      });
    });

    it("handles failed status", () => {
      const res = toCoachMemberStatus("pending", "failed");
      expect(res).toEqual({
        status: "gagal",
        label: "Gagal",
        variant: "destructive",
      });
    });

    it("handles queued and processing status", () => {
      expect(toCoachMemberStatus("pending", "queued")).toEqual({
        status: "diproses",
        label: "Diproses",
        variant: "secondary",
      });
      expect(toCoachMemberStatus("pending", "processing")).toEqual({
        status: "diproses",
        label: "Diproses",
        variant: "secondary",
      });
    });

    it("handles approved, needs_revision, and pending review statuses", () => {
      expect(toCoachMemberStatus("approved", "completed")).toEqual({
        status: "disetujui",
        label: "Disetujui",
        variant: "success",
      });
      expect(toCoachMemberStatus("needs_revision", "completed")).toEqual({
        status: "perlu-revisi",
        label: "Perlu Revisi",
        variant: "warning",
      });
      expect(toCoachMemberStatus("pending", "completed")).toEqual({
        status: "menunggu",
        label: "Menunggu Ulasan",
        variant: "secondary",
      });
    });
  });

  describe("toCoachMemberStats", () => {
    it("maps overview to honest stats with Segera hadir flags", () => {
      const overviewFixture = createMockOverview({
        memberCount: 15,
        reviewQueueCount: 3,
        statistics: createMockActivitySummary({
          completedSessionCount: 45,
          scoredSessionCount: 40,
        }),
      });

      const stats = toCoachMemberStats(overviewFixture);
      expect(stats).toHaveLength(4);

      expect(stats[0]).toEqual({
        id: "total-atlet",
        label: "Total Binaan",
        value: "15 Atlet",
        valueAvailable: true,
        badge: "Rincian tahap: Segera hadir",
        badgeAvailable: false,
      });

      expect(stats[1]).toEqual({
        id: "akurasi-tim",
        label: "Rata Akurasi",
        value: "Segera hadir",
        valueAvailable: false,
        badge: "Target ≥ 85%",
        badgeAvailable: false,
        note: "40 sesi dinilai",
        noteAvailable: true,
      });

      expect(stats[2]).toEqual({
        id: "sidang-uji",
        label: "Kelulusan",
        value: "Segera hadir",
        valueAvailable: false,
        note: "Ambang kelulusan: Segera hadir",
        noteAvailable: false,
      });

      expect(stats[3]).toEqual({
        id: "fokus",
        label: "Sesi Rekaman",
        value: "45 Sesi",
        valueAvailable: true,
        badge: "Segera hadir",
        badgeAvailable: false,
        note: "3 menunggu ulasan",
        noteAvailable: true,
      });
    });
  });

  describe("toCoachMemberListItems & toCoachMembersPageViewModel", () => {
    it("handles empty roster and null fields", () => {
      const overview = createMockOverview({
        memberCount: 0,
        reviewQueueCount: 0,
      });

      const emptyRoster = zRosterPage.parse({
        items: [],
        nextCursor: null,
      });

      const vm = toCoachMembersPageViewModel(overview, emptyRoster, "");
      expect(vm.memberCount).toBe(0);
      expect(vm.countLabel).toBe("0 Atlet");
      expect(vm.members).toEqual([]);
      expect(vm.nextCursor).toBeNull();
    });

    it("maps roster items with null npm, null score, null latestSession", () => {
      const roster = zRosterPage.parse({
        items: [
          {
            profile: createMockProfile({
              id: "mem-1",
              fullName: "Budi Santoso",
              npm: null,
              belt: "Kuning",
              beltTarget: null,
            }),
            latestSession: null,
          },
          {
            profile: createMockProfile({
              id: "mem-2",
              fullName: "Dewi Lestari",
              npm: "123456",
              belt: null,
              beltTarget: null,
            }),
            latestSession: {
              session: createMockSession({
                id: "sess-2",
                movementSlug: "kuda-kuda",
                processingStatus: "completed",
                reviewStatus: "approved",
              }),
              score: 87.5,
              scoreReason: null,
              movementName: "Kuda-kuda Tengah",
            },
          },
        ],
        nextCursor: "cursor-next",
      });

      const items = toCoachMemberListItems(roster);
      expect(items).toHaveLength(2);

      expect(items[0]).toEqual({
        id: "mem-1",
        initials: "BS",
        name: "Budi Santoso",
        nim: "—",
        status: "belum-ada",
        statusLabel: "Belum Ada Sesi",
        statusVariant: "outline",
        score: null,
        scoreLabel: "Belum dinilai",
        lastGerakan: "Belum ada sesi",
        detailHref: "/coach/members/mem-1",
      });

      expect(items[1]).toEqual({
        id: "mem-2",
        initials: "DL",
        name: "Dewi Lestari",
        nim: "123456",
        status: "disetujui",
        statusLabel: "Disetujui",
        statusVariant: "success",
        score: 87.5,
        scoreLabel: "87,5 poin",
        lastGerakan: "Kuda-kuda Tengah",
        detailHref: "/coach/members/mem-2",
      });

      const overview = createMockOverview({
        memberCount: 5,
        reviewQueueCount: 1,
      });

      const pageVm = toCoachMembersPageViewModel(overview, roster, "dewi");
      expect(pageVm.countLabel).toBe("2 dari 5 Atlet");
      expect(pageVm.nextCursor).toBe("cursor-next");
      expect(pageVm.q).toBe("dewi");
    });
  });

  describe("toCoachMemberProfile", () => {
    it("maps member detail profile and honest UI slots", () => {
      const detail = zRosterDetail.parse({
        profile: createMockProfile({
          id: "m-100",
          fullName: "Fajar Pratama",
          npm: "987654",
          belt: "Hijau",
          beltTarget: "Biru",
        }),
        latestSession: null,
        statistics: createMockActivitySummary({
          scoredSessionCount: 8,
        }),
      });

      const profile = toCoachMemberProfile(detail);
      expect(profile).toEqual({
        id: "m-100",
        name: "Fajar Pratama",
        nim: "987654",
        status: "belum-ada",
        statusLabel: "Belum Ada Sesi",
        statusVariant: "outline",
        beltLabel: "Hijau",
        beltTargetLabel: "Target: Biru",
        attendance: { available: false, label: "Segera hadir" },
        aggregate: { available: false, label: "Segera hadir" },
        scoredSessionCount: 8,
      });
    });
  });

  describe("toCoachMemberPillars", () => {
    it("implements single-unambiguous-group, multi-version, and empty rules", () => {
      const stats = createMockActivitySummary({
        similarityGroups: [
          // Single valid group for kuda-kuda
          {
            movementSlug: "kuda-kuda",
            sampleCount: 5,
            averageScore: 92.4,
            method: "static-reference-pose",
            analyzerVersion: "v1",
            featureVersion: "v1",
            referenceVersion: "v1",
          },
          // Multi-version groups for pukulan
          {
            movementSlug: "pukulan",
            sampleCount: 3,
            averageScore: 80.0,
            method: "static-reference-pose",
            analyzerVersion: "v1",
            featureVersion: "v1",
            referenceVersion: "v1",
          },
          {
            movementSlug: "pukulan",
            sampleCount: 2,
            averageScore: 85.0,
            method: "static-reference-pose",
            analyzerVersion: "v2",
            featureVersion: "v1",
            referenceVersion: "v1",
          },
          // Tangkisan has group but null averageScore
          {
            movementSlug: "tangkisan",
            sampleCount: 1,
            averageScore: null,
            method: "static-reference-pose",
            analyzerVersion: "v1",
            featureVersion: "v1",
            referenceVersion: "v1",
          },
          // Tendangan has 0 groups
        ],
      });

      const pillars = toCoachMemberPillars(stats);
      expect(pillars).toHaveLength(4);

      // 1. kuda-kuda: single group -> Terdata
      expect(pillars[0]).toEqual({
        slug: "kuda-kuda",
        name: "Kuda-kuda",
        score: 92.4,
        scoreLabel: "92,4 poin",
        sampleCount: 5,
        sampleLabel: "5 sesi dinilai",
        status: "terdata",
        statusLabel: "Terdata",
        statusVariant: "success",
        barPercent: 92.4,
      });

      // 2. pukulan: multi-version -> Multi-versi, belum dinilai
      expect(pillars[1]).toEqual({
        slug: "pukulan",
        name: "Pukulan Lurus",
        score: null,
        scoreLabel: "Belum dinilai",
        sampleCount: 5,
        sampleLabel: "Multi-versi",
        status: "belum-dinilai",
        statusLabel: "Belum Dinilai",
        statusVariant: "outline",
        barPercent: 0,
      });

      // 3. tangkisan: null averageScore
      expect(pillars[2]).toEqual({
        slug: "tangkisan",
        name: "Tangkisan",
        score: null,
        scoreLabel: "Belum dinilai",
        sampleCount: 1,
        sampleLabel: "1 sesi dinilai",
        status: "belum-dinilai",
        statusLabel: "Belum Dinilai",
        statusVariant: "outline",
        barPercent: 0,
      });

      // 4. tendangan: 0 groups
      expect(pillars[3]).toEqual({
        slug: "tendangan",
        name: "Tendangan",
        score: null,
        scoreLabel: "Belum dinilai",
        sampleCount: 0,
        sampleLabel: "Belum ada sesi",
        status: "belum-dinilai",
        statusLabel: "Belum Dinilai",
        statusVariant: "outline",
        barPercent: 0,
      });
    });
  });

  describe("toCoachMemberEvaluationViewModel", () => {
    it("returns honest empty state when sessionDetail or evaluation is null", () => {
      const empty = toCoachMemberEvaluationViewModel(null);
      expect(empty.available).toBe(false);
      expect(empty.score.label).toBe("Belum dinilai");
      expect(empty.score.target.label).toBe("Segera hadir");
      expect(empty.score.delta.label).toBe("Segera hadir");
      expect(empty.analysisMetrics).toEqual([]);
      expect(empty.measurements).toEqual([]);
      expect(empty.postures).toEqual([]);
    });

    it("maps dynamic analysis counters, measurements, and postures", () => {
      const sessionDetailFixture = zCoachSessionDetail.parse({
        session: createMockSession({
          id: "sess-99",
          movementSlug: "pukulan",
          processingStatus: "completed",
          reviewStatus: "approved",
        }),
        evaluation: {
          id: "eval-99",
          sessionId: "sess-99",
          movementSlug: "pukulan",
          evaluatedAt: "2026-10-10T12:01:00Z",
          analysisStatus: "experimental",
          score: 84.2,
          scoreUnit: "similarity_points",
          scoreReason: null,
          matchedVariant: "Lurus Depan",
          method: "static-reference-pose",
          analyzerVersion: "1.0",
          featureVersion: "1.0",
          referenceVersion: "1.0",
          poseStatus: "detected",
          framesProcessed: 120,
          validPoseFrames: 115,
          featuresCompared: 14,
          keyFrame: null,
          measurements: [
            {
              feature: "elbow_angle",
              bodyPart: "siku_kanan",
              value: 92.5,
              unit: "deg",
              referenceMedian: 90,
              referenceIqr: 5,
              deviation: 2.5,
              assessment: "within_reference",
              reason: "Siku sesuai standar",
            },
          ],
          issues: [],
          unavailableReasons: [],
        },
        coach: null,
        review: {
          id: "rev-1",
          author: createMockCoachIdentity(),
          publishedAt: "2026-10-10T13:00:00Z",
          revision: 1,
          decision: "approved",
          note: "Gerakan pukulan sudah stabil.",
          bodyAssessments: [
            {
              bodyPart: "siku_kanan",
              status: "approved",
              note: "Posisi siku sudah tepat 90 derajat.",
            },
          ],
          taskIds: [],
          supersedesReviewId: null,
        },
        legacyNotes: [],
        feedbackDraft: {
          version: 2,
          author: createMockCoachIdentity(),
          updatedAt: "2026-10-10T12:30:00Z",
          decision: "approved",
          note: "Draft catatan pelatih.",
          bodyAssessments: [],
          tasks: [],
        },
      });

      const vm = toCoachMemberEvaluationViewModel(sessionDetailFixture);
      expect(vm.available).toBe(true);
      expect(vm.techniqueName).toBe("Pukulan Lurus (Lurus Depan)");
      expect(vm.score.value).toBe(84.2);
      expect(vm.score.label).toBe("84,2 poin");
      expect(vm.score.target.label).toBe("Segera hadir");
      expect(vm.score.delta.label).toBe("Segera hadir");

      expect(vm.analysisMetrics).toEqual([
        { label: "Frame Diproses", value: "120", sub: "Total frame video" },
        { label: "Frame Pose Valid", value: "115", sub: "Pose terdeteksi" },
        { label: "Fitur Dibandingkan", value: "14", sub: "Titik pengukuran" },
        { label: "Status Pose", value: "detected", sub: "Kualitas deteksi" },
      ]);

      expect(vm.measurements).toEqual([
        {
          id: "siku_kanan",
          label: "Siku kanan",
          value: "92.5 deg",
          sub: "Within reference",
        },
      ]);

      expect(vm.postures.length).toBeGreaterThanOrEqual(1);
      const siku = vm.postures.find((p) => p.id === "siku_kanan");
      expect(siku).toBeDefined();
      expect(siku?.status).toBe("sesuai");
    });
  });

  describe("toCoachMemberHistoryItem & toCoachMemberHistoryPage", () => {
    it("maps history page items and cursor", () => {
      const historyFixture = zHistoryPage.parse({
        items: [
          {
            session: createMockSession({
              id: "h-1",
              movementSlug: "tangkisan",
              processingStatus: "completed",
              reviewStatus: "needs_revision",
              createdAt: "2026-03-06T15:45:00Z",
              startedAt: "2026-03-06T15:45:00Z",
              updatedAt: "2026-03-06T15:46:00Z",
            }),
            score: 74.0,
            scoreReason: null,
            movementName: "Tangkisan Atas",
            review: {
              id: "r-1",
              author: createMockCoachIdentity(),
              publishedAt: "2026-03-06T16:00:00Z",
              revision: 1,
              decision: "needs_revision",
              note: "Perbaiki sudut tangkisan.",
              bodyAssessments: [],
              taskIds: [],
              supersedesReviewId: null,
            },
          },
        ],
        nextCursor: "cur-history-next",
      });

      const historyPageVm = toCoachMemberHistoryPage(
        historyFixture,
        "member-xyz",
        10,
      );
      expect(historyPageVm.memberId).toBe("member-xyz");
      expect(historyPageVm.items).toHaveLength(1);
      expect(historyPageVm.nextCursor).toBe("cur-history-next");

      const item = historyPageVm.items[0];
      expect(item.id).toBe("h-1");
      expect(item.title).toBe("Tangkisan Atas");
      expect(item.subtitle).toBe("Perbaiki sudut tangkisan.");
      expect(item.score).toBe(74.0);
      expect(item.scoreLabel).toBe("74 poin");
      expect(item.status).toBe("perlu-revisi");
      expect(item.statusLabel).toBe("Perlu Revisi");
      expect(item.statusVariant).toBe("warning");
    });
  });

  describe("toCoachMemberDetailViewModel", () => {
    it("integrates profile, pillars, evaluation, history, and feedback versions", () => {
      const detail = zRosterDetail.parse({
        profile: createMockProfile({
          id: "m-1",
          fullName: "Ahmad Dahlan",
          npm: "112233",
          belt: "Putih",
          beltTarget: "Kuning",
        }),
        latestSession: {
          session: createMockSession({
            id: "s-1",
            movementSlug: "tendangan",
            processingStatus: "completed",
            reviewStatus: "pending",
          }),
          score: 80,
          scoreReason: null,
          movementName: "Tendangan Lurus",
        },
        statistics: createMockActivitySummary({
          scoredSessionCount: 1,
        }),
      });

      const sessionDetail = zCoachSessionDetail.parse({
        session: createMockSession({
          id: "s-1",
          movementSlug: "tendangan",
          processingStatus: "completed",
          reviewStatus: "pending",
        }),
        evaluation: null,
        coach: null,
        feedbackDraft: {
          version: 3,
          author: createMockCoachIdentity(),
          updatedAt: "2026-10-10T11:00:00Z",
          decision: "approved",
          note: "Catatan draft versi 3.",
          bodyAssessments: [],
          tasks: [],
        },
        review: null,
        legacyNotes: [],
      });

      const history = zHistoryPage.parse({
        items: [
          {
            session: createMockSession({
              id: "s-1",
              movementSlug: "tendangan",
              processingStatus: "completed",
              reviewStatus: "pending",
            }),
            score: 80,
            scoreReason: null,
            movementName: "Tendangan Lurus",
          },
        ],
        nextCursor: null,
      });

      const vm = toCoachMemberDetailViewModel(detail, sessionDetail, history);
      expect(vm.profile.name).toBe("Ahmad Dahlan");
      expect(vm.pillars).toHaveLength(4);
      expect(vm.history).toHaveLength(1);
      expect(vm.feedback).toEqual({
        sessionId: "s-1",
        sessionLabel: expect.stringContaining("Tendangan Lurus ·"),
        draftVersion: 3,
        reviewRevision: 0,
        decision: "approved",
        note: "Catatan draft versi 3.",
      });
    });
  });
});
