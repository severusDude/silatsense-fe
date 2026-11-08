import { describe, expect, it } from "vitest";
import type { CoachOverview as CoachOverviewDto, RosterPage } from "@/api";
import { zCoachOverview, zRosterPage } from "@/api/zod.gen";
import {
  toCoachAthletes,
  toCoachDashboardViewModel,
  toCoachPillars,
  toCoachStats,
  toPostureIssues,
} from "@/features/coach/data/coach-dashboard-mapper";

const validOverviewFixture: CoachOverviewDto = zCoachOverview.parse({
  memberCount: 5,
  reviewQueueCount: 2,
  statistics: {
    completedSessionCount: 30,
    totalDurationSeconds: 7200,
    durationSampleCount: 30,
    scoredSessionCount: 24,
    excludedScoreCount: 1,
    similarityGroups: [
      {
        movementSlug: "kuda-kuda",
        method: "static-reference-pose",
        analyzerVersion: "1.0",
        featureVersion: "1.0",
        referenceVersion: "1.0",
        averageScore: 94.8,
        sampleCount: 10,
      },
      {
        movementSlug: "tangkisan",
        method: "static-reference-pose",
        analyzerVersion: "1.0",
        featureVersion: "1.0",
        referenceVersion: "1.0",
        averageScore: 89.0,
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
        movementSlug: "tendangan",
        method: "static-reference-pose",
        analyzerVersion: "1.0",
        featureVersion: "1.0",
        referenceVersion: "1.0",
        averageScore: 78.0,
        sampleCount: 6,
      },
    ],
  },
  recentSessions: [],
  topIssues: [
    { feature: "elevasi_siku", sessionCount: 7 },
    { feature: "sudut_lutut", sessionCount: 5 },
    { feature: "posisi_bahu", sessionCount: 4 },
  ],
});

const validRosterFixture: RosterPage = zRosterPage.parse({
  items: [
    {
      profile: {
        id: "mem-1",
        role: "member",
        fullName: "Aced Suryana",
        npm: "2307051",
        email: "aced@example.com",
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
      latestSession: {
        session: {
          id: "sess-1",
          movementSlug: "kuda-kuda",
          createdAt: "2026-11-06T10:00:00Z",
          uploadedAt: null,
          startedAt: null,
          completedAt: null,
          processingStatus: "completed",
          analysisStatus: null,
          evaluationId: "eval-1",
          reviewStatus: "approved",
          reviewAvailable: true,
          retryOf: null,
          acknowledgedAt: null,
          error: null,
          media: {
            status: "available",
            expiresAt: null,
            mimeType: "video/webm",
            byteSize: 1024,
            durationSeconds: 15,
            width: 1280,
            height: 720,
            playbackPath: "/video/1",
          },
        },
        movementName: "Kuda-kuda Tengah",
        score: 80.5,
        scoreReason: null,
        review: null,
      },
    },
    {
      profile: {
        id: "mem-2",
        role: "member",
        fullName: "Siti Nurhaliza",
        npm: "2307052",
        email: "siti@example.com",
        emailVerifiedAt: null,
        division: "Seni",
        title: null,
        belt: "Kuning",
        beltTarget: "Hijau",
        passwordChangedAt: null,
        coach: null,
        createdAt: "2026-01-01T00:00:00Z",
        statistics: null,
      },
      latestSession: {
        session: {
          id: "sess-2",
          movementSlug: "tendangan",
          createdAt: "2026-11-06T11:00:00Z",
          uploadedAt: null,
          startedAt: null,
          completedAt: null,
          processingStatus: "completed",
          analysisStatus: null,
          evaluationId: "eval-2",
          reviewStatus: "needs_revision",
          reviewAvailable: true,
          retryOf: null,
          acknowledgedAt: null,
          error: null,
          media: {
            status: "available",
            expiresAt: null,
            mimeType: "video/webm",
            byteSize: 1024,
            durationSeconds: 15,
            width: 1280,
            height: 720,
            playbackPath: "/video/2",
          },
        },
        movementName: "Tendangan Lurus",
        score: 76.0,
        scoreReason: null,
        review: null,
      },
    },
  ],
  nextCursor: null,
});

describe("coach-dashboard-mapper", () => {
  it("maps valid overview and roster to CoachDashboardViewModel", () => {
    const vm = toCoachDashboardViewModel(validOverviewFixture, validRosterFixture);

    expect(vm.memberCount).toBe(5);
    expect(vm.reviewQueueCount).toBe(2);
    expect(vm.completedSessionCount).toBe(30);
    expect(vm.scoredSessionCount).toBe(24);
    expect(vm.athleteCountLabel).toBe("2 dari 5 Atlet");
    expect(vm.stats).toHaveLength(4);
    expect(vm.athletes).toHaveLength(2);
    expect(vm.pillars).toHaveLength(4);
    expect(vm.posture).toHaveLength(3);
  });

  describe("toCoachStats", () => {
    it("maps overview stats with contract-backed values and honest UI flags", () => {
      const stats = toCoachStats(validOverviewFixture);

      const totalAtlet = stats.find((s) => s.id === "total-atlet")!;
      expect(totalAtlet.label).toBe("Total Atlet");
      expect(totalAtlet.value).toBe("5 Atlet");
      expect(totalAtlet.valueAvailable).toBe(true);
      expect(totalAtlet.badge).toBe("Rincian tahap: Segera hadir");
      expect(totalAtlet.badgeAvailable).toBe(false);
      expect(totalAtlet.footerLeft).toBe("Ketuntasan");
      expect(totalAtlet.footerRight).toBe("Segera hadir");
      expect(totalAtlet.footerRightAvailable).toBe(false);

      const akurasiTim = stats.find((s) => s.id === "akurasi-tim")!;
      expect(akurasiTim.label).toBe("Akurasi Tim");
      expect(akurasiTim.value).toBe("Segera hadir");
      expect(akurasiTim.valueAvailable).toBe(false);
      expect(akurasiTim.badge).toBe("Target ≥ 85%");
      expect(akurasiTim.badgeAvailable).toBe(false);
      expect(akurasiTim.footerLeft).toBe("Sesi Dinilai");
      expect(akurasiTim.footerRight).toBe("24");
      expect(akurasiTim.footerRightAvailable).toBe(true);

      const ulasanTertunda = stats.find((s) => s.id === "sidang-uji")!;
      expect(ulasanTertunda.label).toBe("Ulasan Tertunda");
      expect(ulasanTertunda.value).toBe("2 Antrean");
      expect(ulasanTertunda.valueAvailable).toBe(true);
      expect(ulasanTertunda.note).toBe("Nama antrean: Segera hadir");
      expect(ulasanTertunda.noteAvailable).toBe(false);
      expect(ulasanTertunda.footerLeft).toBe("Total Sesi");
      expect(ulasanTertunda.footerRight).toBe("30");
      expect(ulasanTertunda.footerRightAvailable).toBe(true);

      const isuTeratas = stats.find((s) => s.id === "fokus")!;
      expect(isuTeratas.label).toBe("Isu Teratas");
      expect(isuTeratas.value).toBe("Elevasi siku");
      expect(isuTeratas.valueAvailable).toBe(true);
      expect(isuTeratas.note).toBe("7 sesi terindikasi");
      expect(isuTeratas.noteAvailable).toBe(true);
    });

    it("handles empty topIssues with fallback text", () => {
      const emptyIssuesOverview: CoachOverviewDto = {
        ...validOverviewFixture,
        topIssues: [],
      };
      const stats = toCoachStats(emptyIssuesOverview);
      const isuTeratas = stats.find((s) => s.id === "fokus")!;

      expect(isuTeratas.value).toBe("Belum ada isu");
      expect(isuTeratas.valueAvailable).toBe(false);
      expect(isuTeratas.note).toBeUndefined();
    });
  });

  describe("toCoachAthletes", () => {
    it("maps roster items, initials, scores in poin, and review status badges", () => {
      const { athletes, athleteCountLabel } = toCoachAthletes(validRosterFixture, 2);

      expect(athleteCountLabel).toBe("2 Atlet");
      expect(athletes).toHaveLength(2);

      const first = athletes[0];
      expect(first.id).toBe("mem-1");
      expect(first.name).toBe("Aced Suryana");
      expect(first.initials).toBe("AS");
      expect(first.status).toBe("disetujui");
      expect(first.statusLabel).toBe("Disetujui");
      expect(first.statusVariant).toBe("success");
      expect(first.score).toBe(80.5);
      expect(first.scoreLabel).toBe("80,5 poin");
      expect(first.lastGerakan).toBe("Kuda-kuda Tengah");
      expect(first.detailHref).toBe("/coach/members/mem-1");

      const second = athletes[1];
      expect(second.status).toBe("perlu-revisi");
      expect(second.statusLabel).toBe("Perlu Revisi");
      expect(second.statusVariant).toBe("warning");
      expect(second.scoreLabel).toBe("76 poin");
    });

    it("handles truncation label when memberCount > items.length", () => {
      const { athleteCountLabel } = toCoachAthletes(validRosterFixture, 10);
      expect(athleteCountLabel).toBe("2 dari 10 Atlet");
    });

    it("handles null roster and empty roster", () => {
      const nullRes = toCoachAthletes(null, 5);
      expect(nullRes.athletes).toEqual([]);
      expect(nullRes.athleteCountLabel).toBe("0 dari 5 Atlet");

      const emptyRes = toCoachAthletes({ items: [], nextCursor: null }, 0);
      expect(emptyRes.athletes).toEqual([]);
      expect(emptyRes.athleteCountLabel).toBe("0 Atlet");
    });

    it("maps athlete with latestSession null", () => {
      const rosterWithNullSession: RosterPage = {
        items: [
          {
            profile: {
              id: "mem-3",
              role: "member",
              fullName: "Budi Santoso",
              npm: null,
              email: null,
              emailVerifiedAt: null,
              division: null,
              title: null,
              belt: null,
              beltTarget: null,
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

      const { athletes } = toCoachAthletes(rosterWithNullSession, 1);
      const ath = athletes[0];
      expect(ath.status).toBe("belum-ada");
      expect(ath.statusLabel).toBe("Belum Ada Sesi");
      expect(ath.statusVariant).toBe("outline");
      expect(ath.score).toBeNull();
      expect(ath.scoreLabel).toBe("Belum dinilai");
      expect(ath.lastGerakan).toBe("Belum ada sesi");
    });

    it("maps processing and failed review statuses correctly", () => {
      const createItem = (
        id: string,
        reviewStatus: "pending" | "approved" | "needs_revision" | undefined,
        processingStatus: "queued" | "processing" | "completed" | "failed",
      ) => ({
        profile: {
          id,
          role: "member" as const,
          fullName: "User " + id,
          npm: null,
          email: null,
          emailVerifiedAt: null,
          division: null,
          title: null,
          belt: null,
          beltTarget: null,
          passwordChangedAt: null,
          coach: null,
          createdAt: "2026-01-01T00:00:00Z",
          statistics: null,
        },
        latestSession: {
          session: {
            id: `sess-${id}`,
            movementSlug: "pukulan" as const,
            createdAt: "2026-11-06T10:00:00Z",
            uploadedAt: null,
            startedAt: null,
            completedAt: null,
            processingStatus,
            analysisStatus: null,
            evaluationId: null,
            reviewStatus,
            reviewAvailable: true,
            retryOf: null,
            acknowledgedAt: null,
            error: null,
            media: {
              status: "available" as const,
              expiresAt: null,
              mimeType: "video/webm",
              byteSize: 1024,
              durationSeconds: 15,
              width: 1280,
              height: 720,
              playbackPath: "/video",
            },
          },
          movementName: "",
          score: null,
          scoreReason: null,
          review: null,
        },
      });

      const roster: RosterPage = {
        items: [
          createItem("1", "pending", "failed"),
          createItem("2", "pending", "processing"),
          createItem("3", "pending", "queued"),
          createItem("4", "pending", "completed"),
        ],
        nextCursor: null,
      };

      const { athletes } = toCoachAthletes(roster, 4);

      expect(athletes[0].status).toBe("gagal");
      expect(athletes[0].statusLabel).toBe("Gagal");
      expect(athletes[0].statusVariant).toBe("destructive");

      expect(athletes[1].status).toBe("diproses");
      expect(athletes[1].statusLabel).toBe("Diproses");
      expect(athletes[1].statusVariant).toBe("secondary");

      expect(athletes[2].status).toBe("diproses");
      expect(athletes[2].statusLabel).toBe("Diproses");
      expect(athletes[2].statusVariant).toBe("secondary");

      expect(athletes[3].status).toBe("menunggu");
      expect(athletes[3].statusLabel).toBe("Menunggu Ulasan");
      expect(athletes[3].statusVariant).toBe("secondary");
    });
  });

  describe("toCoachPillars", () => {
    it("orders 4 canonical pillars and maps single unambiguous group to Terdata", () => {
      const pillars = toCoachPillars(validOverviewFixture.statistics);

      expect(pillars.map((p) => p.slug)).toEqual([
        "kuda-kuda",
        "tangkisan",
        "pukulan",
        "tendangan",
      ]);

      const kuda = pillars[0];
      expect(kuda.name).toBe("Kuda-kuda");
      expect(kuda.score).toBe(94.8);
      expect(kuda.scoreLabel).toBe("94,8 poin");
      expect(kuda.sampleLabel).toBe("10 sesi dinilai");
      expect(kuda.status).toBe("terdata");
      expect(kuda.statusLabel).toBe("Terdata");
      expect(kuda.statusVariant).toBe("success");
      expect(kuda.barPercent).toBe(94.8);
    });

    it("handles null averageScore, multiple groups, and zero samples", () => {
      const statistics = {
        completedSessionCount: 10,
        totalDurationSeconds: 1000,
        durationSampleCount: 10,
        scoredSessionCount: 5,
        excludedScoreCount: 0,
        similarityGroups: [
          {
            movementSlug: "kuda-kuda",
            method: "static-reference-pose",
            analyzerVersion: "1.0",
            featureVersion: "1.0",
            referenceVersion: "1.0",
            averageScore: null,
            sampleCount: 3,
          },
          {
            movementSlug: "tangkisan",
            method: "v1",
            analyzerVersion: "1.0",
            featureVersion: "1.0",
            referenceVersion: "1.0",
            averageScore: 80,
            sampleCount: 2,
          },
          {
            movementSlug: "tangkisan",
            method: "v2",
            analyzerVersion: "2.0",
            featureVersion: "2.0",
            referenceVersion: "2.0",
            averageScore: 85,
            sampleCount: 3,
          },
          {
            movementSlug: "pukulan",
            method: "v1",
            analyzerVersion: "1.0",
            featureVersion: "1.0",
            referenceVersion: "1.0",
            averageScore: 90,
            sampleCount: 0,
          },
        ],
      };

      const pillars = toCoachPillars(statistics);

      // kuda-kuda: single group but averageScore is null -> Belum dinilai
      const kuda = pillars.find((p) => p.slug === "kuda-kuda")!;
      expect(kuda.score).toBeNull();
      expect(kuda.scoreLabel).toBe("Belum dinilai");
      expect(kuda.status).toBe("belum-dinilai");
      expect(kuda.statusLabel).toBe("Belum Dinilai");
      expect(kuda.statusVariant).toBe("outline");
      expect(kuda.sampleLabel).toBe("3 sesi dinilai");
      expect(kuda.barPercent).toBe(0);

      // tangkisan: multiple groups -> Multi-versi
      const tangkisan = pillars.find((p) => p.slug === "tangkisan")!;
      expect(tangkisan.score).toBeNull();
      expect(tangkisan.scoreLabel).toBe("Belum dinilai");
      expect(tangkisan.sampleLabel).toBe("Multi-versi");
      expect(tangkisan.barPercent).toBe(0);

      // pukulan: sampleCount is 0 -> Belum dinilai, Belum ada sesi
      const pukulan = pillars.find((p) => p.slug === "pukulan")!;
      expect(pukulan.score).toBeNull();
      expect(pukulan.scoreLabel).toBe("Belum dinilai");
      expect(pukulan.sampleLabel).toBe("Belum ada sesi");
      expect(pukulan.barPercent).toBe(0);

      // tendangan: no groups at all -> Belum ada sesi
      const tendangan = pillars.find((p) => p.slug === "tendangan")!;
      expect(tendangan.score).toBeNull();
      expect(tendangan.scoreLabel).toBe("Belum dinilai");
      expect(tendangan.sampleLabel).toBe("Belum ada sesi");
    });
  });

  describe("toPostureIssues", () => {
    it("maps topIssues array to PostureIssue[] with humanized name and sessionLabel", () => {
      const issues = toPostureIssues([
        { feature: "sudut_siku", sessionCount: 12 },
        { feature: "posisi_kaki", sessionCount: 6 },
      ]);

      expect(issues).toEqual([
        {
          id: "sudut_siku",
          name: "Sudut siku",
          sessionCount: 12,
          sessionLabel: "12 sesi",
          statusLabel: "Terindikasi",
          statusVariant: "warning",
        },
        {
          id: "posisi_kaki",
          name: "Posisi kaki",
          sessionCount: 6,
          sessionLabel: "6 sesi",
          statusLabel: "Terindikasi",
          statusVariant: "warning",
        },
      ]);
    });

    it("returns empty array when topIssues is empty or undefined", () => {
      expect(toPostureIssues([])).toEqual([]);
    });
  });
});
