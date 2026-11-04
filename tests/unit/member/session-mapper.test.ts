import { describe, expect, it } from "vitest";
import type {
  AnalysisIssue,
  EvaluationOut,
  Measurement,
  SessionOut,
} from "@/api";
import {
  toEvaluationViewModel,
  toPostureAssessmentViewModel,
  toSessionViewModel,
} from "@/features/member/data/session-mapper";

function sessionFixture(overrides: Partial<SessionOut> = {}): SessionOut {
  return {
    id: "ses-1",
    movementSlug: "pukulan",
    createdAt: "2026-11-04T02:00:00.000Z",
    uploadedAt: "2026-11-04T02:01:00.000Z",
    startedAt: "2026-11-04T02:00:10.000Z",
    completedAt: "2026-11-04T02:00:57.000Z",
    processingStatus: "completed",
    analysisStatus: "experimental",
    evaluationId: "eval-1",
    retryOf: null,
    acknowledgedAt: null,
    error: null,
    media: {
      status: "available",
      expiresAt: "2026-11-05T02:01:00.000Z",
      mimeType: "video/webm",
      byteSize: 19_083_673,
      durationSeconds: 47,
      width: 1080,
      height: 1920,
      playbackPath: null,
    },
    ...overrides,
  };
}

function measurementFixture(
  overrides: Partial<Measurement> = {},
): Measurement {
  return {
    feature: "right_elbow_angle",
    bodyPart: "Siku kanan",
    value: 142,
    unit: "deg",
    referenceMedian: 134,
    referenceIqr: 8,
    deviation: 8,
    assessment: "deviates",
    reason: "Elevasi siku melebar.",
    ...overrides,
  };
}

function issueFixture(overrides: Partial<AnalysisIssue> = {}): AnalysisIssue {
  return {
    feature: "right_elbow_angle",
    bodyPart: "Siku kanan",
    deviation: 8,
    unit: "deg",
    severity: "medium",
    feedback: "Tarik siku ~8 cm ke dalam.",
    ...overrides,
  };
}

function evaluationFixture(
  overrides: Partial<EvaluationOut> = {},
): EvaluationOut {
  return {
    id: "eval-1",
    sessionId: "ses-1",
    movementSlug: "pukulan",
    evaluatedAt: "2026-09-28T09:45:00.000Z",
    analysisStatus: "experimental",
    score: 82.4,
    scoreUnit: "similarity_points",
    scoreReason: null,
    matchedVariant: "pukulan-lurus-depan",
    method: "static-reference-pose",
    analyzerVersion: "1.0.0",
    featureVersion: "1.0.0",
    referenceVersion: "ref-v1",
    poseStatus: "detected",
    framesProcessed: 90,
    validPoseFrames: 84,
    featuresCompared: 12,
    keyFrame: null,
    measurements: [measurementFixture()],
    issues: [issueFixture()],
    validRepetitions: null,
    deviatedRepetitions: null,
    unavailableReasons: [],
    ...overrides,
  };
}

describe("toSessionViewModel", () => {
  it("maps a completed session with media metadata and formatted dates", () => {
    // Arrange + Act
    const vm = toSessionViewModel(sessionFixture());

    // Assert
    expect(vm).toMatchObject({
      id: "ses-1",
      slug: "pukulan",
      trainingName: "Pukulan Lurus",
      eyebrow: "ULASAN SESI",
      processingStatus: "completed",
      processingLabel: "Selesai",
      analysisStatusLabel: "Eksperimental",
      evaluationId: "eval-1",
      canViewEvaluation: true,
      canRetryAnalysis: false,
      durationSec: 47,
      durationLabel: "00:47",
      fileSizeLabel: "18,2 MB",
      resolutionLabel: "1080×1920",
      formatLabel: "video/webm",
      mediaStatus: "available",
      mediaStatusLabel: "Tersedia",
      startedAtLabel: "4 Nov 2026, 09.00 WIB",
      uploadedAtLabel: "4 Nov 2026, 09.01 WIB",
      completedAtLabel: "4 Nov 2026, 09.00 WIB",
      mediaExpiresAtLabel: "5 Nov 2026, 09.01 WIB",
      acknowledgedAtLabel: "—",
    });
  });

  it.each([
    ["queued", "Menunggu antrean"],
    ["processing", "Sedang diproses"],
    ["completed", "Selesai"],
    ["failed", "Gagal"],
  ] as const)("maps %s processing state", (status, label) => {
    // Arrange + Act
    const vm = toSessionViewModel(sessionFixture({ processingStatus: status }));

    // Assert
    expect(vm.processingStatus).toBe(status);
    expect(vm.processingLabel).toBe(label);
  });

  it.each([
    ["available", "Tersedia"],
    ["expired", "Kedaluwarsa"],
    ["deleted", "Dihapus"],
    ["unavailable", "Tidak tersedia"],
  ] as const)("maps %s media state", (status, label) => {
    // Arrange
    const base = sessionFixture();

    // Act
    const vm = toSessionViewModel({
      ...base,
      media: { ...base.media, status },
    });

    // Assert
    expect(vm.mediaStatus).toBe(status);
    expect(vm.mediaStatusLabel).toBe(label);
  });

  it("surfaces the failure and offers a retry only when processing failed", () => {
    // Arrange + Act
    const failed = toSessionViewModel(
      sessionFixture({
        processingStatus: "failed",
        evaluationId: null,
        analysisStatus: "insufficient_pose",
        error: {
          code: "analysis_failed",
          detail: "Pose tidak terdeteksi pada 12 frame.",
        },
      }),
    );
    const processing = toSessionViewModel(
      sessionFixture({ processingStatus: "processing", evaluationId: null }),
    );

    // Assert
    expect(failed.error).toEqual({
      code: "analysis_failed",
      detail: "Pose tidak terdeteksi pada 12 frame.",
    });
    expect(failed.canRetryAnalysis).toBe(true);
    expect(failed.canViewEvaluation).toBe(false);
    expect(failed.analysisStatusLabel).toBe("Pose tidak terdeteksi");
    expect(processing.canRetryAnalysis).toBe(false);
  });

  it("derives the duration from timestamps when media duration is null", () => {
    // Arrange
    const base = sessionFixture();

    // Act
    const vm = toSessionViewModel({
      ...base,
      media: { ...base.media, durationSeconds: null },
    });

    // Assert
    expect(vm.durationSec).toBe(47);
    expect(vm.durationLabel).toBe("00:47");
  });

  it("renders null timestamps and media fields as dashes", () => {
    // Arrange
    const base = sessionFixture();

    // Act
    const vm = toSessionViewModel({
      ...base,
      startedAt: null,
      uploadedAt: null,
      completedAt: null,
      acknowledgedAt: null,
      media: {
        ...base.media,
        status: "expired",
        expiresAt: null,
        mimeType: null,
        durationSeconds: null,
        width: null,
        height: null,
        byteSize: null,
      },
    });

    // Assert
    expect(vm.durationSec).toBeNull();
    expect(vm.durationLabel).toBe("—");
    expect(vm.fileSizeLabel).toBe("—");
    expect(vm.resolutionLabel).toBe("—");
    expect(vm.formatLabel).toBe("—");
    expect(vm.startedAtLabel).toBe("—");
  });

  it("humanizes an unknown analysis status instead of inventing a label", () => {
    // Arrange + Act
    const vm = toSessionViewModel(
      sessionFixture({ analysisStatus: "reference_version_missing" }),
    );

    // Assert
    expect(vm.analysisStatusLabel).toBe("Reference version missing");
  });
});

describe("toPostureAssessmentViewModel", () => {
  it("maps a deviation with its reading, reason, and matching issue cue", () => {
    // Arrange + Act
    const vm = toPostureAssessmentViewModel(
      measurementFixture(),
      [issueFixture()],
    );

    // Assert
    expect(vm).toEqual({
      id: "right_elbow_angle",
      name: "Siku kanan",
      status: "perlu-koreksi",
      statusLabel: "PERLU KOREKSI",
      reading: "142° → target 130–138°",
      detail: "Elevasi siku melebar.",
      correctionCue: "Tarik siku ~8 cm ke dalam.",
      thumbnailLabel: "Siku kanan",
      thumbnailSrc: null,
    });
  });

  it("maps within-reference and not-assessed states", () => {
    // Arrange + Act
    const within = toPostureAssessmentViewModel(
      measurementFixture({
        feature: "stance_symmetry",
        bodyPart: "Simetri tumpuan",
        value: 0.5,
        unit: "shoulder_width",
        referenceMedian: 0.5,
        referenceIqr: 0.1,
        assessment: "within_reference",
        reason: null,
      }),
      [],
    );
    const withoutIqr = toPostureAssessmentViewModel(
      measurementFixture({
        feature: "stance_width",
        bodyPart: "Lebar kuda-kuda",
        value: 0.5,
        unit: "shoulder_width",
        referenceMedian: 0.5,
        referenceIqr: null,
        assessment: "within_reference",
        reason: null,
      }),
      [],
    );
    const notAssessed = toPostureAssessmentViewModel(
      measurementFixture({
        feature: "knee_angle",
        bodyPart: "Lutut",
        value: null,
        referenceMedian: null,
        referenceIqr: null,
        deviation: null,
        assessment: "not_assessed",
        reason: null,
      }),
      [],
    );

    // Assert
    expect(within.status).toBe("sesuai");
    expect(within.statusLabel).toBe("SESUAI");
    expect(within.reading).toBe(
      "0,5× shoulder width → target 0,45–0,55× shoulder width",
    );
    expect(withoutIqr.reading).toBe(
      "0,5× shoulder width → target 0,5× shoulder width",
    );
    expect(within.correctionCue).toBe("");
    expect(notAssessed.status).toBe("tidak-dinilai");
    expect(notAssessed.statusLabel).toBe("TIDAK DINILAI");
    expect(notAssessed.reading).toBe("—");
    expect(notAssessed.detail).toBe("Tidak ada catatan dari analisis.");
  });

  it("matches an issue by body part when the feature is unknown", () => {
    // Arrange + Act
    const vm = toPostureAssessmentViewModel(
      measurementFixture({
        feature: "left_elbow_extension",
        bodyPart: "Siku kiri",
      }),
      [
        issueFixture({
          feature: "legacy_elbow",
          bodyPart: "Siku kiri",
          feedback: "Luruskan siku kiri.",
        }),
      ],
    );

    // Assert
    expect(vm.id).toBe("left_elbow_extension");
    expect(vm.name).toBe("Siku kiri");
    expect(vm.correctionCue).toBe("Luruskan siku kiri.");
  });

  it("humanizes unknown feature and body-part identifiers", () => {
    // Arrange + Act
    const vm = toPostureAssessmentViewModel(
      measurementFixture({
        feature: "left_elbow_extension",
        bodyPart: "left_elbow",
      }),
      [],
    );

    // Assert
    expect(vm.id).toBe("left_elbow_extension");
    expect(vm.name).toBe("Left elbow");
    expect(vm.thumbnailLabel).toBe("Left elbow");
  });
});

describe("toEvaluationViewModel", () => {
  it("maps a similarity score in points with posture quality and media meta", () => {
    // Arrange + Act
    const vm = toEvaluationViewModel(
      evaluationFixture(),
      toSessionViewModel(sessionFixture()),
    );

    // Assert
    expect(vm).toMatchObject({
      id: "eval-1",
      sessionId: "ses-1",
      slug: "pukulan",
      techniqueName: "Pukulan Lurus",
      evaluatedAtLabel: "28 Sep 2026, 16.45 WIB",
      framesProcessed: 90,
      validPoseFrames: 84,
      featuresCompared: 12,
      poseStatus: "detected",
      postureQualityLabel: "Kualitas pose: 84/90 frame valid",
      repetitionCountingAvailable: false,
      mediaStatus: "available",
      mediaMetaLabel: "1080×1920 · video/webm",
    });
    expect(vm.score).toEqual({
      available: true,
      value: 82.4,
      unitLabel: "poin",
      max: 100,
      status: "experimental",
      statusLabel: "Eksperimental",
      reason: null,
      variantLabel: "pukulan-lurus-depan",
      summary: "1 dari 1 parameter perlu koreksi.",
    });
  });

  it("renders an honest unavailable score with the server reasons", () => {
    // Arrange + Act
    const vm = toEvaluationViewModel(
      evaluationFixture({
        score: null,
        analysisStatus: "reference_not_ready",
        scoreReason: null,
        measurements: [],
        issues: [],
        unavailableReasons: ["Referensi gerakan belum tersedia."],
      }),
      null,
    );

    // Assert
    expect(vm.score.available).toBe(false);
    expect(vm.score.value).toBeNull();
    expect(vm.score.statusLabel).toBe("Referensi belum siap");
    expect(vm.score.summary).toBe("Referensi gerakan belum tersedia.");
    expect(vm.mediaStatus).toBe("unavailable");
    expect(vm.mediaMetaLabel).toBe("—");
    expect(vm.postures).toEqual([]);
  });

  it("uses the server score reason verbatim and maps every assessment state", () => {
    // Arrange + Act
    const vm = toEvaluationViewModel(
      evaluationFixture({
        scoreReason: "Analisis eksperimental; gunakan sebagai panduan.",
        measurements: [
          measurementFixture(),
          measurementFixture({
            feature: "stance_symmetry",
            bodyPart: "Simetri tumpuan",
            assessment: "within_reference",
          }),
          measurementFixture({
            feature: "knee_angle",
            bodyPart: "Lutut",
            assessment: "not_assessed",
          }),
        ],
        issues: [],
      }),
    );

    // Assert
    expect(vm.score.summary).toBe(
      "Analisis eksperimental; gunakan sebagai panduan.",
    );
    expect(vm.postures.map((posture) => posture.status)).toEqual([
      "perlu-koreksi",
      "sesuai",
      "tidak-dinilai",
    ]);
  });

  it("labels a not-detected pose when the score is unavailable", () => {
    // Arrange + Act
    const vm = toEvaluationViewModel(
      evaluationFixture({
        score: null,
        poseStatus: "not_detected",
        analysisStatus: "insufficient_pose",
        unavailableReasons: [],
        scoreReason: null,
      }),
    );

    // Assert
    expect(vm.score.statusLabel).toBe("Pose tidak terdeteksi");
    expect(vm.score.summary).toBe(
      "Pose pesilat tidak terdeteksi pada rekaman ini.",
    );
  });
});
