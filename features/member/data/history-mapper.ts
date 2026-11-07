import { PILAR_NAMES } from "@/components/shared/silat-reference";
import type {
  ActivitySummary,
  BodyAssessment,
  Dashboard,
  HistoryItem,
  HistoryPage,
  PublishedNote,
  PublishedReview,
  SessionDetail,
  TaskOut,
} from "@/api";
import {
  toEvaluationViewModel,
  toPostureAssessmentViewModel,
  toSessionViewModel,
} from "@/features/member/data/session-mapper";
import type {
  FollowUpTaskViewModel,
  HistoryEntryViewModel,
  HistoryFiltersViewModel,
  HistoryPageViewModel,
  HistoryParamChipViewModel,
  HistoryReviewBadgeStatus,
  HistorySummaryViewModel,
  PostureAssessmentViewModel,
  PublishedNoteViewModel,
  ReviewHistoryItemViewModel,
  SessionDetailViewModel,
  TrainingModuleSlug,
} from "@/features/member/types";

const JAKARTA_TZ = "Asia/Jakarta";

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeZone: JAKARTA_TZ,
});

const timeFormatter = new Intl.DateTimeFormat("id-ID", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: JAKARTA_TZ,
});

export function formatDateId(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return dateFormatter.format(date);
}

export function formatTimeId(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return `${timeFormatter.format(date).replace(":", ".")} WIB`;
}

export function formatDateTimeId(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return `${dateFormatter.format(date)}, ${formatTimeId(iso)}`;
}

export function formatDurationHours(totalSeconds: number | null | undefined): string {
  if (totalSeconds === null || totalSeconds === undefined || totalSeconds <= 0) {
    return "00j 00m";
  }
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${hours.toString().padStart(2, "0")}j ${minutes.toString().padStart(2, "0")}m`;
}

export function getInitials(name: string | null | undefined): string {
  if (!name) return "—";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "—";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function toHistoryReviewBadgeStatus(
  reviewStatus: "pending" | "needs_revision" | "approved" | null | undefined,
  processingStatus: "queued" | "processing" | "completed" | "failed" | null | undefined,
): { status: HistoryReviewBadgeStatus; label: string } {
  if (reviewStatus === "approved") {
    return { status: "sesuai", label: "Disetujui" };
  }
  if (reviewStatus === "needs_revision") {
    return { status: "perlu-koreksi", label: "Perlu Revisi" };
  }
  if (processingStatus === "failed") {
    return { status: "gagal", label: "Gagal" };
  }
  if (processingStatus === "queued" || processingStatus === "processing") {
    return { status: "diproses", label: "Diproses" };
  }
  return { status: "menunggu", label: "Menunggu Ulasan" };
}

export function toHistoryParamChips(
  bodyAssessments: BodyAssessment[] | null | undefined,
): HistoryParamChipViewModel[] {
  if (!bodyAssessments || bodyAssessments.length === 0) {
    return [];
  }
  return bodyAssessments.map((ba) => {
    const isNeedsRevision = ba.status === "needs_revision";
    const isApproved = ba.status === "approved";
    return {
      id: ba.bodyPart,
      name: ba.bodyPart.replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      reading: ba.note ?? (isApproved ? "Sesuai standar" : isNeedsRevision ? "Perlu koreksi" : "Tidak dinilai"),
      status: isApproved ? "sesuai" : isNeedsRevision ? "perlu-koreksi" : "tidak-dinilai",
      deviated: isNeedsRevision,
      actionLabel: isNeedsRevision ? "Koreksi" : undefined,
    };
  });
}

export function toHistorySummaryViewModel(dashboard: Dashboard): HistorySummaryViewModel {
  const stats: ActivitySummary = dashboard.statistics;
  const dominantSlug = dashboard.dominantMovementSlug;
  const dominantName = dominantSlug ? PILAR_NAMES[dominantSlug] : "Belum ada";

  let dominantSessionsCount = 0;
  if (dominantSlug && stats.similarityGroups) {
    for (const group of stats.similarityGroups) {
      if (group.movementSlug === dominantSlug) {
        dominantSessionsCount += group.sampleCount;
      }
    }
  }

  return {
    totalSessionsLabel: `${stats.completedSessionCount} Sesi`,
    sessionsDeltaLabel: "Segera hadir",
    accuracy: {
      available: false,
      label: "Segera hadir",
      note: "Analisis gabungan belum tersedia",
    },
    dominantFocusLabel: dominantName,
    dominantSessionsLabel:
      dominantSessionsCount > 0
        ? `${dominantSessionsCount} sesi dinilai`
        : `${stats.scoredSessionCount} sesi dinilai`,
    durationHoursLabel: formatDurationHours(stats.totalDurationSeconds),
    durationNoteLabel: `${stats.durationSampleCount} sampel durasi`,
  };
}

export function toHistoryEntryViewModel(item: HistoryItem): HistoryEntryViewModel {
  const session = item.session;
  const timestamp = session.startedAt ?? session.createdAt;
  const { status, label: statusLabel } = toHistoryReviewBadgeStatus(
    session.reviewStatus,
    session.processingStatus,
  );

  const fallbackSummary =
    item.review?.note ??
    item.scoreReason ??
    session.error?.detail ??
    (session.processingStatus === "completed"
      ? "Sesi selesai dianalisis"
      : "Menunggu pemrosesan");

  const scoreAvailable = item.score !== null;
  const scoreLabel = scoreAvailable ? `${Math.round(item.score!)} poin` : "—";
  const scoreCaption = scoreAvailable ? "Skor Kemiripan" : "Belum dinilai";

  return {
    id: session.id,
    slug: session.movementSlug as TrainingModuleSlug,
    techniqueName: item.movementName || PILAR_NAMES[session.movementSlug as TrainingModuleSlug] || session.movementSlug,
    dateLabel: formatDateId(timestamp),
    timeLabel: formatTimeId(timestamp),
    summary: fallbackSummary,
    status,
    statusLabel,
    scoreAvailable,
    score: item.score,
    scoreLabel,
    scoreCaption,
    params: toHistoryParamChips(item.review?.bodyAssessments),
    coachNote: item.review?.note ?? null,
    hasPublishedReview: Boolean(item.review),
  };
}

export function toHistoryPageViewModel(
  page: HistoryPage,
  filters: HistoryFiltersViewModel,
): HistoryPageViewModel {
  return {
    items: page.items.map(toHistoryEntryViewModel),
    nextCursor: page.nextCursor,
    filters,
  };
}

export function toFollowUpTaskViewModel(task: TaskOut): FollowUpTaskViewModel {
  let statusLabel = "Perlu Dikerjakan";
  if (task.status === "completed") statusLabel = "Selesai";
  if (task.status === "dismissed") statusLabel = "Diabaikan";

  return {
    id: task.id,
    sessionId: task.sessionId,
    reviewId: task.reviewId,
    authorName: task.author.fullName,
    instruction: task.instruction,
    status: task.status,
    statusLabel,
    updatedAtLabel: formatDateTimeId(task.updatedAt),
  };
}

export function toPublishedNoteViewModel(note: PublishedNote): PublishedNoteViewModel {
  return {
    id: note.id,
    authorName: note.author.fullName,
    text: note.text,
    publishedAtLabel: formatDateTimeId(note.publishedAt),
  };
}

export function toReviewHistoryItemViewModel(review: PublishedReview): ReviewHistoryItemViewModel {
  return {
    id: review.id,
    revision: review.revision,
    authorName: review.author.fullName,
    publishedAtLabel: formatDateTimeId(review.publishedAt),
    decision: review.decision,
    decisionLabel: review.decision === "approved" ? "Disetujui" : "Perlu Revisi",
    note: review.note,
  };
}

export function toSessionDetailViewModel(detail: SessionDetail): SessionDetailViewModel {
  const sessionVm = toSessionViewModel(detail.session);
  const evaluationVm = detail.evaluation ? toEvaluationViewModel(detail.evaluation, sessionVm) : null;
  const slug = detail.session.movementSlug as TrainingModuleSlug;
  const baseName = PILAR_NAMES[slug] ?? slug;
  const techniqueName = detail.evaluation?.matchedVariant
    ? `${baseName} (${detail.evaluation.matchedVariant})`
    : baseName;

  const techniqueDesc = `${formatDateTimeId(detail.session.startedAt ?? detail.session.createdAt)} • ${
    detail.session.processingStatus === "completed" ? "Selesai dianalisis" : "Diproses"
  }`;

  const coachAuthor = detail.review?.author ?? detail.coach;
  const coach = coachAuthor
    ? {
        assigned: true,
        initials: getInitials(coachAuthor.fullName),
        name: coachAuthor.fullName,
        role: coachAuthor.title ?? "Pelatih Penilai",
      }
    : {
        assigned: false,
        initials: "—",
        name: "Pelatih Belum Ditugaskan",
        role: "Tim Pelatih Silat",
      };

  const reviewDecision: "pending" | "approved" | "needs_revision" =
    detail.review?.decision ??
    (detail.session.reviewStatus === "approved"
      ? "approved"
      : detail.session.reviewStatus === "needs_revision"
        ? "needs_revision"
        : "pending");

  const reviewDecisionLabel =
    reviewDecision === "approved"
      ? "Disetujui"
      : reviewDecision === "needs_revision"
        ? "Perlu Revisi"
        : "Menunggu Ulasan";

  const scoreValue = detail.evaluation?.score ?? null;
  const scoreAvailable = scoreValue !== null;
  const scoreLabel = scoreAvailable ? `${Math.round(scoreValue!)} poin` : "Belum dinilai";

  // Body assessments from coach review
  const coachBodyAssessments: PostureAssessmentViewModel[] = (detail.review?.bodyAssessments ?? []).map((ba) => {
    const isNeedsRevision = ba.status === "needs_revision" || (ba as unknown as { status: string }).status === "needs_work";
    const isApproved = ba.status === "approved";
    const name = ba.bodyPart.replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    return {
      id: ba.bodyPart,
      name,
      status: isApproved ? "sesuai" : isNeedsRevision ? "perlu-koreksi" : "tidak-dinilai",
      statusLabel: isApproved ? "SESUAI" : isNeedsRevision ? "PERLU KOREKSI" : "TIDAK DINILAI",
      reading: ba.note ?? (isApproved ? "Sesuai standar" : isNeedsRevision ? "Perlu koreksi" : "Tidak dinilai"),
      detail: ba.note ?? "Catatan penilaian pelatih.",
      correctionCue: isNeedsRevision ? (ba.note ?? "Perbaiki posisi sesuai arahan.") : "",
      thumbnailLabel: name,
      thumbnailSrc: null,
      deviation: isNeedsRevision ? "warning" : "normal",
      coachNote: ba.note,
      coachNeedsWork: isNeedsRevision,
    };
  });

  // AI posture items (merged with coach assessment flags if joint matches)
  const aiPostures: PostureAssessmentViewModel[] = (detail.evaluation?.measurements ?? []).map((measurement) => {
    const base = toPostureAssessmentViewModel(measurement, detail.evaluation?.issues ?? []);
    const matchingCoachBa = detail.review?.bodyAssessments?.find(
      (ba) =>
        ba.bodyPart.toLowerCase() === measurement.bodyPart.toLowerCase() ||
        ba.bodyPart.toLowerCase() === measurement.feature.toLowerCase(),
    );
    const coachNeedsWork =
      matchingCoachBa?.status === "needs_revision" ||
      (matchingCoachBa as unknown as { status: string })?.status === "needs_work";

    return {
      ...base,
      deviation: base.status === "perlu-koreksi" ? "warning" : "normal",
      coachNote: matchingCoachBa?.note ?? null,
      coachNeedsWork: Boolean(coachNeedsWork),
    };
  });

  return {
    id: detail.session.id,
    slug,
    techniqueName,
    techniqueDesc,
    session: sessionVm,
    evaluation: evaluationVm,
    coach,
    reviewDecision,
    reviewDecisionLabel,
    reviewRevision: detail.review?.revision ?? null,
    decidedAtLabel: detail.review?.publishedAt ? formatDateTimeId(detail.review.publishedAt) : null,
    reviewNote: detail.review?.note ?? null,
    focusTechnique: baseName,
    score: {
      available: scoreAvailable,
      value: scoreValue,
      label: scoreLabel,
      unitLabel: "poin",
      analysisStatusLabel: sessionVm.analysisStatusLabel,
      passThreshold: { available: false, label: "Segera hadir" },
    },
    retestSchedule: {
      available: false,
      label: "Jadwal Uji Ulang:",
      value: "Segera hadir",
    },
    coachBodyAssessments,
    aiPostures,
    reviewHistory: (detail.reviewHistory ?? []).map(toReviewHistoryItemViewModel),
    legacyNotes: (detail.legacyNotes ?? []).map(toPublishedNoteViewModel),
    followUpTasks: (detail.followUpTasks ?? []).map(toFollowUpTaskViewModel),
  };
}
