import type {
  ActivitySummary,
  CoachOverview,
  CoachSessionDetail,
  HistoryItem,
  HistoryPage,
  RosterDetail,
  RosterPage,
  SessionDetail,
  SessionOut,
} from "@/api";
import {
  getInitials,
  PILAR_NAMES,
  type PilarSlug,
} from "@/components/shared/silat-reference";
import {
  formatDateTimeId,
  formatScore,
  humanizeIdentifier,
} from "@/features/member/data/format";
import { toSessionDetailViewModel } from "@/features/member/data/history-mapper";
import type {
  CoachBadgeVariant,
  CoachMemberDetailViewModel,
  CoachMemberEvaluationViewModel,
  CoachMemberHistoryItem,
  CoachMemberHistoryPageViewModel,
  CoachMemberListItem,
  CoachMemberPillarViewModel,
  CoachMemberProfileViewModel,
  CoachMemberStat,
  CoachMemberStatus,
  CoachMembersPageViewModel,
} from "@/features/coach/types";

export function toCoachMemberStatus(
  reviewStatus?: SessionOut["reviewStatus"] | null,
  processingStatus?: SessionOut["processingStatus"] | null,
): { status: CoachMemberStatus; label: string; variant: CoachBadgeVariant } {
  if (
    (reviewStatus === undefined || reviewStatus === null) &&
    (processingStatus === undefined || processingStatus === null)
  ) {
    return { status: "belum-ada", label: "Belum Ada Sesi", variant: "outline" };
  }

  if (processingStatus === "failed") {
    return { status: "gagal", label: "Gagal", variant: "destructive" };
  }

  if (processingStatus === "queued" || processingStatus === "processing") {
    return { status: "diproses", label: "Diproses", variant: "secondary" };
  }

  if (reviewStatus === "approved") {
    return { status: "disetujui", label: "Disetujui", variant: "success" };
  }

  if (reviewStatus === "needs_revision") {
    return { status: "perlu-revisi", label: "Perlu Revisi", variant: "warning" };
  }

  if (reviewStatus === "pending") {
    return { status: "menunggu", label: "Menunggu Ulasan", variant: "secondary" };
  }

  return { status: "menunggu", label: "Menunggu Ulasan", variant: "secondary" };
}

export function toCoachMemberStats(overview: CoachOverview): CoachMemberStat[] {
  return [
    {
      id: "total-atlet",
      label: "Total Binaan",
      value: `${overview.memberCount} Atlet`,
      valueAvailable: true,
      badge: "Rincian tahap: Segera hadir",
      badgeAvailable: false,
    },
    {
      id: "akurasi-tim",
      label: "Rata Akurasi",
      value: "Segera hadir",
      valueAvailable: false,
      badge: "Target ≥ 85%",
      badgeAvailable: false,
      note: `${overview.statistics.scoredSessionCount} sesi dinilai`,
      noteAvailable: true,
    },
    {
      id: "sidang-uji",
      label: "Kelulusan",
      value: "Segera hadir",
      valueAvailable: false,
      note: "Ambang kelulusan: Segera hadir",
      noteAvailable: false,
    },
    {
      id: "fokus",
      label: "Sesi Rekaman",
      value: `${overview.statistics.completedSessionCount} Sesi`,
      valueAvailable: true,
      badge: "Segera hadir",
      badgeAvailable: false,
      note: `${overview.reviewQueueCount} menunggu ulasan`,
      noteAvailable: true,
    },
  ];
}

export function toCoachMemberListItems(
  roster: RosterPage | null,
): CoachMemberListItem[] {
  if (!roster?.items) {
    return [];
  }

  return roster.items.map((item) => {
    const initials = getInitials(item.profile.fullName);
    const nim = item.profile.npm ?? "—";
    const { status, label: statusLabel, variant: statusVariant } =
      item.latestSession
        ? toCoachMemberStatus(
            item.latestSession.session.reviewStatus,
            item.latestSession.session.processingStatus,
          )
        : toCoachMemberStatus(null, null);

    const score = item.latestSession?.score ?? null;
    const scoreLabel =
      score !== null ? `${formatScore(score)} poin` : "Belum dinilai";

    const slug = item.latestSession?.session?.movementSlug as
      | PilarSlug
      | undefined;
    const lastGerakan = item.latestSession
      ? item.latestSession.movementName ||
        (slug ? PILAR_NAMES[slug] : undefined) ||
        "Belum ada sesi"
      : "Belum ada sesi";

    return {
      id: item.profile.id,
      initials,
      name: item.profile.fullName,
      nim,
      status,
      statusLabel,
      statusVariant,
      score,
      scoreLabel,
      lastGerakan,
      detailHref: `/coach/members/${item.profile.id}`,
    };
  });
}

export function toCoachMembersPageViewModel(
  overview: CoachOverview,
  roster: RosterPage | null,
  q: string = "",
): CoachMembersPageViewModel {
  const stats = toCoachMemberStats(overview);
  const members = toCoachMemberListItems(roster);
  const countLabel =
    roster &&
    roster.items.length < overview.memberCount &&
    roster.items.length > 0
      ? `${roster.items.length} dari ${overview.memberCount} Atlet`
      : `${overview.memberCount} Atlet`;

  return {
    stats,
    members,
    memberCount: overview.memberCount,
    countLabel,
    nextCursor: roster?.nextCursor ?? null,
    q,
  };
}

export function toCoachMemberProfile(
  detail: RosterDetail,
): CoachMemberProfileViewModel {
  const { status, label: statusLabel, variant: statusVariant } =
    detail.latestSession
      ? toCoachMemberStatus(
          detail.latestSession.session.reviewStatus,
          detail.latestSession.session.processingStatus,
        )
      : toCoachMemberStatus(null, null);

  return {
    id: detail.profile.id,
    name: detail.profile.fullName,
    nim: detail.profile.npm ?? "—",
    status,
    statusLabel,
    statusVariant,
    beltLabel: detail.profile.belt ?? "—",
    beltTargetLabel: detail.profile.beltTarget
      ? `Target: ${detail.profile.beltTarget}`
      : null,
    attendance: { available: false, label: "Segera hadir" },
    aggregate: { available: false, label: "Segera hadir" },
    scoredSessionCount: detail.statistics.scoredSessionCount,
  };
}

const CANONICAL_PILARS: readonly PilarSlug[] = [
  "kuda-kuda",
  "pukulan",
  "tangkisan",
  "tendangan",
];

export function toCoachMemberPillars(
  statistics: ActivitySummary,
): CoachMemberPillarViewModel[] {
  const groups = statistics.similarityGroups ?? [];

  return CANONICAL_PILARS.map((slug) => {
    const slugGroups = groups.filter((g) => g.movementSlug === slug);
    const validGroups = slugGroups.filter(
      (g) => g.averageScore !== null && g.sampleCount > 0,
    );

    const name = PILAR_NAMES[slug] ?? slug;

    if (validGroups.length === 1) {
      const g = validGroups[0];
      const score = g.averageScore;
      return {
        slug,
        name,
        score,
        scoreLabel: score !== null ? `${formatScore(score)} poin` : "Belum dinilai",
        sampleCount: g.sampleCount,
        sampleLabel: `${g.sampleCount} sesi dinilai`,
        status: "terdata" as const,
        statusLabel: "Terdata" as const,
        statusVariant: "success" as const,
        barPercent: Math.min(100, Math.max(0, score ?? 0)),
      };
    }

    if (slugGroups.length > 1) {
      const totalSampleCount = slugGroups.reduce(
        (acc, g) => acc + g.sampleCount,
        0,
      );
      return {
        slug,
        name,
        score: null,
        scoreLabel: "Belum dinilai",
        sampleCount: totalSampleCount,
        sampleLabel: "Multi-versi",
        status: "belum-dinilai" as const,
        statusLabel: "Belum Dinilai" as const,
        statusVariant: "outline" as const,
        barPercent: 0,
      };
    }

    const totalSampleCount = slugGroups.reduce(
      (acc, g) => acc + g.sampleCount,
      0,
    );
    return {
      slug,
      name,
      score: null,
      scoreLabel: "Belum dinilai",
      sampleCount: totalSampleCount,
      sampleLabel:
        totalSampleCount > 0
          ? `${totalSampleCount} sesi dinilai`
          : "Belum ada sesi",
      status: "belum-dinilai" as const,
      statusLabel: "Belum Dinilai" as const,
      statusVariant: "outline" as const,
      barPercent: 0,
    };
  });
}

export function toCoachMemberEvaluationViewModel(
  sessionDetail: CoachSessionDetail | null,
): CoachMemberEvaluationViewModel {
  if (!sessionDetail || !sessionDetail.evaluation) {
    const slug = sessionDetail?.session?.movementSlug as PilarSlug | undefined;
    return {
      available: false,
      techniqueName:
        (slug ? PILAR_NAMES[slug] : undefined) ||
        (sessionDetail ? "Sesi Latihan" : "Belum Ada Sesi"),
      metaLabel: sessionDetail
        ? formatDateTimeId(
            sessionDetail.session.startedAt ?? sessionDetail.session.createdAt,
          )
        : "—",
      score: {
        available: false,
        value: null,
        label: "Belum dinilai",
        unitLabel: "poin",
        analysisStatusLabel: null,
        target: { available: false, label: "Segera hadir" },
        delta: { available: false, label: "Segera hadir" },
      },
      analysisMetrics: [],
      measurements: [],
      postures: [],
      session: null,
    };
  }

  const mapped = toSessionDetailViewModel(
    sessionDetail as unknown as SessionDetail,
  );
  const evaluation = sessionDetail.evaluation;
  const slug = sessionDetail.session.movementSlug as PilarSlug | undefined;
  const baseName = (slug ? PILAR_NAMES[slug] : undefined) ?? sessionDetail.session.movementSlug;
  const techniqueName = evaluation.matchedVariant
    ? `${baseName} (${evaluation.matchedVariant})`
    : baseName;

  const timestamp = formatDateTimeId(
    evaluation.evaluatedAt ??
      sessionDetail.session.startedAt ??
      sessionDetail.session.createdAt,
  );
  const status =
    sessionDetail.session.processingStatus === "completed"
      ? "Selesai dianalisis"
      : "Diproses";
  const metaLabel = `${timestamp} • ${status}`;

  const scoreValue = evaluation.score ?? null;
  const scoreAvailable = scoreValue !== null;
  const scoreLabel = scoreAvailable
    ? `${formatScore(scoreValue)} poin`
    : "Belum dinilai";

  const analysisMetrics = [
    {
      label: "Frame Diproses",
      value: String(evaluation.framesProcessed ?? 0),
      sub: "Total frame video",
    },
    {
      label: "Frame Pose Valid",
      value: String(evaluation.validPoseFrames ?? 0),
      sub: "Pose terdeteksi",
    },
    {
      label: "Fitur Dibandingkan",
      value: String(evaluation.featuresCompared ?? 0),
      sub: "Titik pengukuran",
    },
    {
      label: "Status Pose",
      value: evaluation.poseStatus ?? "—",
      sub: "Kualitas deteksi",
    },
  ];

  const measurements = (evaluation.measurements ?? []).slice(0, 4).map((m, idx) => ({
    id: `${m.bodyPart ?? m.feature ?? idx}`,
    label: humanizeIdentifier(m.bodyPart || m.feature),
    value: m.unit ? `${m.value} ${m.unit}` : `${m.value}`,
    sub: m.assessment ? humanizeIdentifier(m.assessment) : "Pengukuran pose",
  }));

  const postureMap = new Map<
    string,
    {
      id: string;
      name: string;
      status: "sesuai" | "perlu-koreksi" | "tidak-dinilai";
      statusLabel: string;
      reading: string;
      note: string | null;
    }
  >();

  for (const ap of mapped.aiPostures ?? []) {
    postureMap.set(ap.id, {
      id: ap.id,
      name: ap.name,
      status: ap.status,
      statusLabel: ap.statusLabel,
      reading: ap.reading,
      note: ap.coachNote ?? ap.detail,
    });
  }

  for (const ba of mapped.coachBodyAssessments ?? []) {
    postureMap.set(ba.id, {
      id: ba.id,
      name: ba.name,
      status: ba.status,
      statusLabel: ba.statusLabel,
      reading: ba.reading,
      note: ba.detail,
    });
  }

  return {
    available: true,
    techniqueName,
    metaLabel,
    score: {
      available: scoreAvailable,
      value: scoreValue,
      label: scoreLabel,
      unitLabel: "poin",
      analysisStatusLabel: status,
      target: { available: false, label: "Segera hadir" },
      delta: { available: false, label: "Segera hadir" },
    },
    analysisMetrics,
    measurements,
    postures: Array.from(postureMap.values()),
    session: mapped.session,
  };
}

export function toCoachMemberHistoryItem(
  item: HistoryItem,
): CoachMemberHistoryItem {
  const full = formatDateTimeId(item.session.startedAt ?? item.session.createdAt);
  const [d, t] = full.split(", ");
  const dateLabel = d ?? full;
  const timeLabel = t ?? "";

  const slug = item.session.movementSlug as PilarSlug | undefined;
  const title =
    item.movementName ||
    (slug ? PILAR_NAMES[slug] : undefined) ||
    "Sesi Latihan";

  const subtitle =
    item.review?.note ?? item.scoreReason ?? "Sesi selesai dianalisis";

  const score = item.score;
  const scoreLabel =
    score !== null ? `${formatScore(score)} poin` : "Belum dinilai";

  const { status, label: statusLabel, variant: statusVariant } =
    toCoachMemberStatus(item.session.reviewStatus, item.session.processingStatus);

  return {
    id: item.session.id,
    dateLabel,
    timeLabel,
    title,
    subtitle,
    score,
    scoreLabel,
    status,
    statusLabel,
    statusVariant,
  };
}

export function toCoachMemberHistoryPage(
  page: HistoryPage,
  memberId: string,
  limit: number = 10,
): CoachMemberHistoryPageViewModel {
  return {
    memberId,
    items: (page.items ?? []).map(toCoachMemberHistoryItem),
    nextCursor: page.nextCursor ?? null,
    limit,
  };
}

export function toCoachMemberDetailViewModel(
  detail: RosterDetail,
  sessionDetail: CoachSessionDetail | null,
  history: HistoryPage | null,
): CoachMemberDetailViewModel {
  const profile = toCoachMemberProfile(detail);
  const pillars = toCoachMemberPillars(detail.statistics);
  const evaluation = toCoachMemberEvaluationViewModel(sessionDetail);
  const historyItems = (history?.items ?? [])
    .slice(0, 4)
    .map(toCoachMemberHistoryItem);

  const sessionId =
    sessionDetail?.session?.id ?? detail.latestSession?.session?.id ?? null;

  const sessionSlug = (sessionDetail?.session?.movementSlug ??
    detail.latestSession?.session?.movementSlug) as PilarSlug | undefined;
  const movementTitle =
    detail.latestSession?.movementName ||
    (sessionSlug ? PILAR_NAMES[sessionSlug] : undefined) ||
    "Sesi";

  const timestamp = sessionDetail?.session
    ? formatDateTimeId(
        sessionDetail.session.startedAt ?? sessionDetail.session.createdAt,
      )
    : detail.latestSession?.session
      ? formatDateTimeId(
          detail.latestSession.session.startedAt ??
            detail.latestSession.session.createdAt,
        )
      : null;

  const sessionLabel =
    sessionId && timestamp ? `${movementTitle} · ${timestamp}` : null;

  const feedback = {
    sessionId,
    sessionLabel,
    draftVersion: sessionDetail?.feedbackDraft?.version ?? 0,
    reviewRevision: sessionDetail?.review?.revision ?? 0,
    decision:
      sessionDetail?.feedbackDraft?.decision ??
      (sessionDetail?.review?.decision as "approved" | "needs_revision" | null) ??
      null,
    note:
      sessionDetail?.feedbackDraft?.note ??
      sessionDetail?.review?.note ??
      "",
  };

  return {
    profile,
    pillars,
    evaluation,
    history: historyItems,
    feedback,
  };
}
