import type {
  AnalysisIssue,
  EvaluationOut,
  Measurement,
  SessionOut,
} from "@/api";
import { PILAR_NAMES } from "@/components/shared/silat-reference";
import {
  formatBytes,
  formatClock,
  formatDateTimeId,
  formatReading,
  formatResolution,
  humanizeIdentifier,
} from "@/features/member/data/format";
import type {
  EvaluationScoreViewModel,
  EvaluationViewModel,
  PostureAssessmentViewModel,
  SessionViewModel,
} from "@/features/member/types";

const PROCESSING_LABELS: Record<SessionViewModel["processingStatus"], string> = {
  queued: "Menunggu antrean",
  processing: "Sedang diproses",
  completed: "Selesai",
  failed: "Gagal",
};

const MEDIA_STATUS_LABELS: Record<SessionViewModel["mediaStatus"], string> = {
  available: "Tersedia",
  expired: "Kedaluwarsa",
  deleted: "Dihapus",
  unavailable: "Tidak tersedia",
};

const ANALYSIS_STATUS_LABELS: Record<
  EvaluationScoreViewModel["status"],
  string
> = {
  experimental: "Eksperimental",
  reference_not_ready: "Referensi belum siap",
  insufficient_pose: "Pose tidak terdeteksi",
  insufficient_features: "Fitur tidak cukup",
};

const ASSESSMENT_LABELS: Record<
  Measurement["assessment"],
  { status: PostureAssessmentViewModel["status"]; label: string }
> = {
  within_reference: { status: "sesuai", label: "SESUAI" },
  deviates: { status: "perlu-koreksi", label: "PERLU KOREKSI" },
  not_assessed: { status: "tidak-dinilai", label: "TIDAK DINILAI" },
};

function analysisStatusLabel(value: string | null): string | null {
  if (!value) return null;
  return (
    ANALYSIS_STATUS_LABELS[value as EvaluationScoreViewModel["status"]] ??
    humanizeIdentifier(value)
  );
}

function resolveDurationSeconds(session: SessionOut): number | null {
  if (session.media.durationSeconds !== null) {
    return session.media.durationSeconds;
  }
  if (session.startedAt && session.completedAt) {
    const diff =
      (Date.parse(session.completedAt) - Date.parse(session.startedAt)) / 1000;
    if (Number.isFinite(diff) && diff >= 0) return Math.round(diff);
  }
  return null;
}

export function toSessionViewModel(session: SessionOut): SessionViewModel {
  const durationSec = resolveDurationSeconds(session);

  return {
    id: session.id,
    slug: session.movementSlug,
    trainingName: PILAR_NAMES[session.movementSlug],
    eyebrow: "ULASAN SESI",
    processingStatus: session.processingStatus,
    processingLabel: PROCESSING_LABELS[session.processingStatus],
    analysisStatus: session.analysisStatus,
    analysisStatusLabel: analysisStatusLabel(session.analysisStatus),
    evaluationId: session.evaluationId,
    canViewEvaluation:
      session.evaluationId !== null || session.processingStatus === "completed",
    canRetryAnalysis: session.processingStatus === "failed",
    startedAtLabel: formatDateTimeId(session.startedAt),
    uploadedAtLabel: formatDateTimeId(session.uploadedAt),
    completedAtLabel: formatDateTimeId(session.completedAt),
    durationSec,
    durationLabel: formatClock(durationSec),
    byteSize: session.media.byteSize,
    fileSizeLabel: formatBytes(session.media.byteSize),
    resolutionLabel: formatResolution(
      session.media.width,
      session.media.height,
    ),
    formatLabel: session.media.mimeType ?? "—",
    mediaStatus: session.media.status,
    mediaStatusLabel: MEDIA_STATUS_LABELS[session.media.status],
    mediaExpiresAtLabel: formatDateTimeId(session.media.expiresAt),
    error: session.error,
    acknowledgedAtLabel: formatDateTimeId(session.acknowledgedAt),
    retryOf: session.retryOf,
  };
}

export function toPostureAssessmentViewModel(
  measurement: Measurement,
  issues: AnalysisIssue[],
): PostureAssessmentViewModel {
  const assessment = ASSESSMENT_LABELS[measurement.assessment];
  const issue =
    issues.find((item) => item.feature === measurement.feature) ??
    issues.find((item) => item.bodyPart === measurement.bodyPart);
  const name = humanizeIdentifier(measurement.bodyPart);

  return {
    id: measurement.feature,
    name,
    status: assessment.status,
    statusLabel: assessment.label,
    reading: formatReading(
      measurement.value,
      measurement.unit,
      measurement.referenceMedian,
      measurement.referenceIqr,
    ),
    detail: measurement.reason ?? "Tidak ada catatan dari analisis.",
    correctionCue: issue?.feedback ?? "",
    thumbnailLabel: name,
    thumbnailSrc: null,
  };
}

function buildScoreSummary(
  evaluation: EvaluationOut,
  postures: PostureAssessmentViewModel[],
): string {
  if (evaluation.scoreReason) return evaluation.scoreReason;

  if (evaluation.score === null) {
    if (evaluation.unavailableReasons.length > 0) {
      return evaluation.unavailableReasons.join(" ");
    }
    if (evaluation.poseStatus === "not_detected") {
      return "Pose pesilat tidak terdeteksi pada rekaman ini.";
    }
    return "Skor kemiripan belum tersedia.";
  }

  const deviations = postures.filter(
    (posture) => posture.status === "perlu-koreksi",
  ).length;
  if (deviations > 0) {
    return `${deviations} dari ${postures.length} parameter perlu koreksi.`;
  }
  if (postures.length > 0) {
    return `${postures.length} parameter berada dalam rentang referensi.`;
  }
  return "Tidak ada parameter postur yang dinilai.";
}

function mediaMetaLabel(session: SessionViewModel | null): string {
  if (!session) return "—";
  const parts = [
    session.resolutionLabel !== "—" ? session.resolutionLabel : null,
    session.formatLabel !== "—" ? session.formatLabel : null,
  ].filter((part): part is string => Boolean(part));
  return parts.length > 0 ? parts.join(" · ") : "—";
}

export function toEvaluationViewModel(
  evaluation: EvaluationOut,
  session: SessionViewModel | null = null,
): EvaluationViewModel {
  const postures = evaluation.measurements.map((measurement) =>
    toPostureAssessmentViewModel(measurement, evaluation.issues),
  );
  const scoreAvailable = evaluation.score !== null;

  return {
    id: evaluation.id,
    sessionId: evaluation.sessionId,
    slug: evaluation.movementSlug,
    techniqueName: PILAR_NAMES[evaluation.movementSlug],
    evaluatedAtLabel: formatDateTimeId(evaluation.evaluatedAt),
    framesProcessed: evaluation.framesProcessed,
    validPoseFrames: evaluation.validPoseFrames,
    featuresCompared: evaluation.featuresCompared,
    poseStatus: evaluation.poseStatus,
    postureQualityLabel:
      evaluation.framesProcessed > 0
        ? `Kualitas pose: ${evaluation.validPoseFrames}/${evaluation.framesProcessed} frame valid`
        : "Kualitas pose: —",
    repetitionCountingAvailable: false,
    score: {
      available: scoreAvailable,
      value: evaluation.score,
      unitLabel: "poin",
      max: 100,
      status: evaluation.analysisStatus,
      statusLabel: ANALYSIS_STATUS_LABELS[evaluation.analysisStatus],
      reason: evaluation.scoreReason,
      variantLabel: evaluation.matchedVariant,
      summary: buildScoreSummary(evaluation, postures),
    },
    postures,
    unavailableReasons: evaluation.unavailableReasons,
    mediaStatus: session?.mediaStatus ?? "unavailable",
    mediaMetaLabel: mediaMetaLabel(session),
  };
}
