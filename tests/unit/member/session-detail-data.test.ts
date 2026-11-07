import { describe, expect, it } from "vitest";
import type { SessionDetail } from "@/api";
import { toSessionDetailViewModel } from "@/features/member/data/history-mapper";
import { updateFollowUpTaskInputSchema } from "@/features/member/schemas/history";

describe("session detail mapper", () => {
  const mockDetail: SessionDetail = {
    session: {
      id: "sess-100",
      movementSlug: "pukulan",
      processingStatus: "completed",
      reviewStatus: "needs_revision",
      startedAt: "2026-09-28T10:00:00Z",
      uploadedAt: "2026-09-28T10:00:30Z",
      completedAt: "2026-09-28T10:01:00Z",
      createdAt: "2026-09-28T09:59:00Z",
      analysisStatus: "completed",
      evaluationId: "eval-100",
      media: {
        status: "available",
        mimeType: "video/webm",
        width: 1280,
        height: 720,
        durationSeconds: 12,
        byteSize: 1500000,
        playbackPath: "/api/member/sessions/sess-100/video",
        expiresAt: "2026-09-29T10:00:00Z",
      },
      error: null,
      acknowledgedAt: null,
      retryOf: null,
    },
    evaluation: {
      id: "eval-100",
      sessionId: "sess-100",
      movementSlug: "pukulan",
      score: 78.6,
      scoreReason: "Elevasi siku terlalu tinggi.",
      analysisStatus: "experimental",
      evaluatedAt: "2026-09-28T10:01:00Z",
      matchedVariant: "Lurus Depan",
      framesProcessed: 360,
      validPoseFrames: 350,
      featuresCompared: 12,
      poseStatus: "detected",
      unavailableReasons: [],
      analyzerVersion: "1.0",
      featureVersion: "1.0",
      referenceVersion: "1.0",
      keyFrame: null,
      measurements: [
        {
          feature: "siku_kanan",
          bodyPart: "siku_kanan",
          value: 145,
          unit: "deg",
          referenceMedian: 135,
          referenceIqr: 5,
          deviation: 10,
          assessment: "deviates",
          reason: "Sudut elevasi melampaui toleransi.",
        },
      ],
      issues: [
        {
          feature: "siku_kanan",
          bodyPart: "siku_kanan",
          severity: "high",
          feedback: "Turunkan sudut siku ~5 cm.",
          deviation: 10,
          unit: "deg",
        },
      ],
    },
    coach: {
      id: "c-1",
      fullName: "Kang Fauzan",
      title: "Kepala Pelatih",
    },
    review: {
      id: "rev-100",
      revision: 2,
      author: {
        id: "c-1",
        fullName: "Kang Fauzan",
        title: "Kepala Pelatih",
      },
      publishedAt: "2026-09-28T10:30:00Z",
      decision: "needs_revision",
      note: "Perbaiki lintasan pukulan agar segaris dengan bahu.",
      bodyAssessments: [
        {
          bodyPart: "siku_kanan",
          status: "needs_revision",
          note: "Siku terlalu membuka ke samping.",
        },
      ],
      taskIds: ["task-1"],
      supersedesReviewId: "rev-99",
    },
    reviewHistory: [
      {
        id: "rev-99",
        revision: 1,
        author: { id: "c-1", fullName: "Kang Fauzan", title: "Kepala Pelatih" },
        publishedAt: "2026-09-28T10:15:00Z",
        decision: "needs_revision",
        note: "Ulasan awal.",
        bodyAssessments: [],
        taskIds: [],
        supersedesReviewId: null,
      },
      {
        id: "rev-100",
        revision: 2,
        author: { id: "c-1", fullName: "Kang Fauzan", title: "Kepala Pelatih" },
        publishedAt: "2026-09-28T10:30:00Z",
        decision: "needs_revision",
        note: "Perbaiki lintasan pukulan agar segaris dengan bahu.",
        bodyAssessments: [],
        taskIds: ["task-1"],
        supersedesReviewId: "rev-99",
      },
    ],
    legacyNotes: [
      {
        id: "note-1",
        author: { id: "c-2", fullName: "Pelatih Pendamping", title: "Asisten" },
        text: "Perhatikan kuda-kuda saat melepas pukulan.",
        publishedAt: "2026-09-28T10:10:00Z",
      },
    ],
    followUpTasks: [
      {
        id: "task-1",
        sessionId: "sess-100",
        reviewId: "rev-100",
        author: { id: "c-1", fullName: "Kang Fauzan", title: "Kepala Pelatih" },
        instruction: "Lakukan drill shadow boxing 3 set x 15 repetisi.",
        status: "open",
        createdAt: "2026-09-28T10:30:00Z",
        updatedAt: "2026-09-28T10:30:00Z",
      },
    ],
  };

  it("maps SessionDetail into complete honest SessionDetailViewModel", () => {
    const vm = toSessionDetailViewModel(mockDetail);

    expect(vm.id).toBe("sess-100");
    expect(vm.slug).toBe("pukulan");
    expect(vm.techniqueName).toBe("Pukulan Lurus (Lurus Depan)");
    expect(vm.coach.assigned).toBe(true);
    expect(vm.coach.name).toBe("Kang Fauzan");
    expect(vm.coach.initials).toBe("KF");
    expect(vm.reviewDecision).toBe("needs_revision");
    expect(vm.reviewDecisionLabel).toBe("Perlu Revisi");
    expect(vm.reviewRevision).toBe(2);

    // Score in points, no %
    expect(vm.score.available).toBe(true);
    expect(vm.score.label).toBe("79 poin"); // Math.round(78.6)
    expect(vm.score.unitLabel).toBe("poin");
    expect(vm.score.passThreshold.available).toBe(false);
    expect(vm.score.passThreshold.label).toBe("Segera hadir");

    // Retest schedule inactive
    expect(vm.retestSchedule.available).toBe(false);
    expect(vm.retestSchedule.value).toBe("Segera hadir");

    // Posture items with AI deviation & coach needs work
    expect(vm.aiPostures.length).toBe(1);
    const posture = vm.aiPostures[0];
    expect(posture.deviation).toBe("warning");
    expect(posture.coachNeedsWork).toBe(true);
    expect(posture.coachNote).toBe("Siku terlalu membuka ke samping.");

    // Review history & legacy notes
    expect(vm.reviewHistory.length).toBe(2);
    expect(vm.legacyNotes.length).toBe(1);

    // Follow-up tasks
    expect(vm.followUpTasks.length).toBe(1);
    expect(vm.followUpTasks[0].instruction).toBe(
      "Lakukan drill shadow boxing 3 set x 15 repetisi.",
    );
    expect(vm.followUpTasks[0].status).toBe("open");
    expect(vm.followUpTasks[0].statusLabel).toBe("Perlu Dikerjakan");
  });

  it("handles unassigned coach and empty evaluation", () => {
    const unreviewedDetail: SessionDetail = {
      session: {
        id: "sess-200",
        movementSlug: "tendangan",
        processingStatus: "queued",
        reviewStatus: "pending",
        startedAt: null,
        uploadedAt: null,
        completedAt: null,
        createdAt: "2026-09-28T10:00:00Z",
        analysisStatus: null,
        evaluationId: null,
        media: {
          status: "available",
          mimeType: "video/webm",
          width: null,
          height: null,
          durationSeconds: null,
          byteSize: null,
          playbackPath: null,
          expiresAt: "2026-09-29T10:00:00Z",
        },
        error: null,
        acknowledgedAt: null,
        retryOf: null,
      },
      evaluation: null,
      coach: null,
      review: null,
      reviewHistory: [],
      legacyNotes: [],
      followUpTasks: [],
    };

    const vm = toSessionDetailViewModel(unreviewedDetail);

    expect(vm.coach.assigned).toBe(false);
    expect(vm.coach.initials).toBe("—");
    expect(vm.reviewDecision).toBe("pending");
    expect(vm.reviewDecisionLabel).toBe("Menunggu Ulasan");
    expect(vm.score.available).toBe(false);
    expect(vm.score.label).toBe("Belum dinilai");
    expect(vm.aiPostures).toEqual([]);
    expect(vm.followUpTasks).toEqual([]);
  });
});

describe("updateFollowUpTaskInputSchema", () => {
  it("accepts valid completed/dismissed task updates", () => {
    const valid = updateFollowUpTaskInputSchema.safeParse({
      taskId: "task-123",
      sessionId: "sess-456",
      status: "completed",
    });
    expect(valid.success).toBe(true);

    const validDismiss = updateFollowUpTaskInputSchema.safeParse({
      taskId: "task-123",
      sessionId: "sess-456",
      status: "dismissed",
    });
    expect(validDismiss.success).toBe(true);
  });

  it("rejects invalid status or missing taskId", () => {
    const invalid = updateFollowUpTaskInputSchema.safeParse({
      taskId: "",
      sessionId: "sess-456",
      status: "in_progress",
    });
    expect(invalid.success).toBe(false);
  });
});
