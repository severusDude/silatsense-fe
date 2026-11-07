import { PILAR_NAMES } from "@/components/shared/silat-reference";
import type { AuthUser, DailyActivity, Dashboard, HistoryItem } from "@/api";
import {
  formatDurationId,
  formatScore,
  humanizeIdentifier,
} from "@/features/member/data/format";
import {
  formatDateTimeId,
  formatDurationHours,
  formatScoreReason,
  getInitials,
  toHistoryReviewBadgeStatus,
} from "@/features/member/data/history-mapper";
import { TRAINING_MODULE_SLUGS } from "@/features/member/data/training-mapper";
import type {
  CoachNoteData,
  GreetingData,
  HeroMetricData,
  LastSessionData,
  MemberDashboardViewModel,
  PillarStat,
  PillarStatus,
  SessionObservation,
  TrainingModuleSlug,
  WeekDay,
  WeeklyData,
} from "@/features/member/types";

const DEFAULT_TIMEZONE = "Asia/Jakarta";

const WEEKDAY_SHORT_ID: readonly string[] = [
  "Min",
  "Sen",
  "Sel",
  "Rab",
  "Kam",
  "Jum",
  "Sab",
];

function formatYmdInTimeZone(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((p) => p.type === "year")?.value ?? "1970";
  const month = parts.find((p) => p.type === "month")?.value ?? "01";
  const day = parts.find((p) => p.type === "day")?.value ?? "01";
  return `${year}-${month}-${day}`;
}

function parseYmdToUtcMs(ymd: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd.trim());
  if (!match) return null;
  const year = Number.parseInt(match[1], 10);
  const month = Number.parseInt(match[2], 10);
  const day = Number.parseInt(match[3], 10);
  return Date.UTC(year, month - 1, day);
}

function weekdayLabelFromYmd(ymd: string): string {
  const utcMs = parseYmdToUtcMs(ymd);
  if (utcMs === null) return "—";
  const dayIndex = new Date(utcMs + 12 * 3600 * 1000).getUTCDay();
  return WEEKDAY_SHORT_ID[dayIndex] ?? "—";
}

function computeDaysAgoInTimeZone(
  isoTimestamp: string | null | undefined,
  now: Date,
  timeZone: string,
): number | null {
  if (!isoTimestamp) return null;
  const parsed = new Date(isoTimestamp);
  if (Number.isNaN(parsed.getTime())) return null;

  const sessionYmd = formatYmdInTimeZone(parsed, timeZone);
  const nowYmd = formatYmdInTimeZone(now, timeZone);
  const sessionUtc = parseYmdToUtcMs(sessionYmd);
  const nowUtc = parseYmdToUtcMs(nowYmd);

  if (sessionUtc === null || nowUtc === null) return null;
  const diffDays = Math.round((nowUtc - sessionUtc) / 86_400_000);
  return Math.max(0, diffDays);
}

export function toGreetingViewModel(
  dashboard: Dashboard,
  user?: AuthUser | null,
  now: Date = new Date(),
): GreetingData {
  const rawName = user?.fullName?.trim() ?? "";
  const firstName = rawName ? rawName.split(/\s+/)[0] : "Pesilat";

  const focusSlug: TrainingModuleSlug =
    dashboard.dominantMovementSlug ??
    (dashboard.lastSession?.session.movementSlug as TrainingModuleSlug | undefined) ??
    "kuda-kuda";
  const focusTechnique = PILAR_NAMES[focusSlug] ?? "Kuda-kuda";

  const timeZone = dashboard.timezone ?? DEFAULT_TIMEZONE;
  const lastSessionIso =
    dashboard.lastSession?.session.startedAt ??
    dashboard.lastSession?.session.createdAt ??
    null;

  const daysAgo = computeDaysAgoInTimeZone(lastSessionIso, now, timeZone);
  const hasRecordedSession = Boolean(dashboard.lastSession);

  let lastSessionRecencyLabel = "Belum ada sesi latihan mandiri yang terekam.";
  if (hasRecordedSession && daysAgo !== null) {
    if (daysAgo === 0) {
      lastSessionRecencyLabel = "Sesi latihan mandiri terakhirmu hari ini.";
    } else if (daysAgo === 1) {
      lastSessionRecencyLabel = "Sesi latihan mandiri terakhirmu kemarin.";
    } else {
      lastSessionRecencyLabel = `Sesi latihan mandiri terakhirmu ${daysAgo} hari lalu.`;
    }
  } else if (hasRecordedSession) {
    lastSessionRecencyLabel = "Sesi latihan mandiri terakhirmu telah tercatat.";
  }

  return {
    name: firstName,
    lastSessionDaysAgo: daysAgo,
    lastSessionRecencyLabel,
    focusSlug,
    focusTechnique,
    hasRecordedSession,
  };
}

export function toHeroMetricViewModel(dashboard: Dashboard): HeroMetricData {
  const lastSession = dashboard.lastSession;
  const scoreValue = lastSession?.score ?? null;
  const scoreAvailable = scoreValue !== null;

  let statusLabel = "Belum Ada Sesi";
  let statusVariant: HeroMetricData["statusVariant"] = "outline";

  if (lastSession) {
    if (scoreAvailable) {
      statusLabel = "Sesi Terakhir Dinilai";
      statusVariant = "success";
    } else {
      statusLabel = "Menunggu Evaluasi";
      statusVariant = "secondary";
    }
  }

  const scoreLabel = scoreAvailable ? `${Math.round(scoreValue!)} poin` : "Belum dinilai";

  let scoreSubtitle = "Rekam sesi latihan untuk melihat skor kemiripan";
  if (lastSession) {
    const movement =
      lastSession.movementName ||
      PILAR_NAMES[lastSession.session.movementSlug as TrainingModuleSlug] ||
      lastSession.session.movementSlug;

    if (scoreAvailable) {
      scoreSubtitle = `Skor Kemiripan Terkini • ${movement}`;
    } else {
      const reason = formatScoreReason(lastSession.scoreReason);
      scoreSubtitle = reason ? `${movement} • ${reason}` : `${movement} • Menunggu penilaian`;
    }
  }

  return {
    statusLabel,
    statusVariant,
    scoreAvailable,
    scoreValue,
    scoreLabel,
    scoreSubtitle,
    completedSessionsLabel: `${dashboard.statistics.completedSessionCount} Sesi Selesai`,
    totalDurationLabel: formatDurationHours(dashboard.statistics.totalDurationSeconds),
    compositeAccuracy: { available: false, label: "Segera hadir" },
    sensorTelemetry: { available: false, label: "Segera hadir" },
  };
}

export function toPillarStatsViewModel(dashboard: Dashboard): PillarStat[] {
  const groups = dashboard.statistics.similarityGroups ?? [];
  const activeSlug: TrainingModuleSlug | null =
    dashboard.dominantMovementSlug ??
    (dashboard.lastSession?.session.movementSlug as TrainingModuleSlug | undefined) ??
    null;

  return TRAINING_MODULE_SLUGS.map((slug) => {
    const allForSlug = groups.filter((group) => group.movementSlug === slug);
    const sampleCount = allForSlug.reduce(
      (sum, group) => sum + (group.sampleCount > 0 ? group.sampleCount : 0),
      0,
    );

    const scoredGroups = allForSlug.filter(
      (group) => group.averageScore !== null && group.sampleCount > 0,
    );

    // Only show a numeric average when a single unambiguous analyzer/reference group exists
    const singleGroup = scoredGroups.length === 1 ? scoredGroups[0] : null;
    const scoreAvailable = singleGroup !== null && singleGroup.averageScore !== null;
    const avgScore = scoreAvailable ? singleGroup!.averageScore : null;
    const avgLabel = scoreAvailable ? `${formatScore(avgScore!)} poin` : "Segera hadir";

    const detail =
      sampleCount > 0 ? `${sampleCount} sesi dinilai` : "Belum ada sesi";

    const isLatestNeedsRevision =
      dashboard.lastSession?.session.movementSlug === slug &&
      dashboard.lastSession.session.reviewStatus === "needs_revision";

    let status: PillarStatus = "belum-dinilai";
    let statusLabel = "Belum Dinilai";

    if (isLatestNeedsRevision) {
      status = "perlu-koreksi";
      statusLabel = "Perlu Revisi";
    } else if (scoreAvailable) {
      status = "terdata";
      statusLabel = "Terdata";
    }

    return {
      slug,
      name: PILAR_NAMES[slug],
      status,
      statusLabel,
      detail,
      scoreAvailable,
      avgScore,
      avgLabel,
      sampleCount,
      active: activeSlug === slug,
      href: `/latihan/${slug}`,
    };
  });
}

function mapReviewBadgeVariant(
  status: ReturnType<typeof toHistoryReviewBadgeStatus>["status"],
): LastSessionData["badgeVariant"] {
  switch (status) {
    case "sesuai":
      return "success";
    case "perlu-koreksi":
      return "warning";
    case "gagal":
      return "destructive";
    case "diproses":
      return "outline";
    case "menunggu":
    default:
      return "secondary";
  }
}

export function toLastSessionViewModel(
  lastSession: HistoryItem | null,
): LastSessionData | null {
  if (!lastSession) return null;

  const session = lastSession.session;
  const slug = session.movementSlug as TrainingModuleSlug;
  const technique = lastSession.movementName || PILAR_NAMES[slug] || slug;
  const timestamp = session.startedAt ?? session.createdAt;
  const time = formatDateTimeId(timestamp);
  const durationLabel = formatDurationId(session.media.durationSeconds);

  const scoreValue = lastSession.score;
  const scoreAvailable = scoreValue !== null;
  const reviewBadge = toHistoryReviewBadgeStatus(
    session.reviewStatus,
    session.processingStatus,
  );
  const badgeVariant = mapReviewBadgeVariant(reviewBadge.status);
  const badgeLabel = scoreAvailable
    ? `${Math.round(scoreValue!)} poin — ${reviewBadge.label}`
    : reviewBadge.label;

  const observations: SessionObservation[] = [];

  for (const ba of lastSession.review?.bodyAssessments ?? []) {
    const tone: SessionObservation["tone"] =
      ba.status === "approved"
        ? "good"
        : ba.status === "needs_revision"
          ? "warning"
          : "neutral";
    const defaultBody =
      ba.status === "approved"
        ? "Postur sesuai standar evaluasi pelatih."
        : ba.status === "needs_revision"
          ? "Perlu perbaikan postur sesuai arahan pelatih."
          : "Parameter belum dinilai.";

    observations.push({
      tone,
      title: humanizeIdentifier(ba.bodyPart),
      body: ba.note?.trim() || defaultBody,
    });
  }

  if (lastSession.review?.note?.trim()) {
    observations.push({
      tone: "neutral",
      title: "Catatan Pelatih",
      body: lastSession.review.note.trim(),
    });
  }

  if (observations.length === 0) {
    const reasonText =
      formatScoreReason(lastSession.scoreReason) ??
      formatScoreReason(session.error?.detail);

    observations.push({
      tone: session.processingStatus === "failed" ? "warning" : "neutral",
      title: "Status Evaluasi Sesi",
      body:
        reasonText ??
        "Sesi telah dianalisis. Buka Detail Evaluasi untuk melihat rincian parameter sudut dan postur.",
    });
  }

  return {
    id: session.id,
    slug,
    technique,
    time,
    durationLabel,
    reps: { available: false, label: "Segera hadir" },
    scoreAvailable,
    scoreValue,
    badgeLabel,
    badgeVariant,
    observations,
    retryHref: `/latihan/${slug}/rekam`,
    detailHref: `/riwayat/${session.id}`,
  };
}

function buildSevenDayActivity(
  weeklyActivity: DailyActivity[],
  now: Date,
  timeZone: string,
): DailyActivity[] {
  if (weeklyActivity.length === 7) {
    return [...weeklyActivity].sort((a, b) => a.date.localeCompare(b.date));
  }

  const byDate = new Map<string, DailyActivity>();
  for (const entry of weeklyActivity) {
    byDate.set(entry.date, entry);
  }

  const anchorYmd = formatYmdInTimeZone(now, timeZone);
  const anchorUtc = parseYmdToUtcMs(anchorYmd) ?? Date.now();

  const result: DailyActivity[] = [];
  for (let offset = 6; offset >= 0; offset -= 1) {
    const dayDate = new Date(anchorUtc - offset * 86_400_000);
    const ymd = dayDate.toISOString().slice(0, 10);
    const existing = byDate.get(ymd);
    result.push(
      existing ?? {
        date: ymd,
        sessionCount: 0,
        durationSeconds: 0,
      },
    );
  }

  return result;
}

export function toWeeklyDataViewModel(
  dashboard: Dashboard,
  now: Date = new Date(),
): WeeklyData {
  const timeZone = dashboard.timezone ?? DEFAULT_TIMEZONE;
  const normalizedDays = buildSevenDayActivity(
    dashboard.weeklyActivity ?? [],
    now,
    timeZone,
  );

  const maxSessionCount = Math.max(
    1,
    ...normalizedDays.map((item) => item.sessionCount),
  );

  let lastActiveIndex = -1;
  normalizedDays.forEach((item, index) => {
    if (item.sessionCount > 0) {
      lastActiveIndex = index;
    }
  });

  const days: WeekDay[] = normalizedDays.map((item, index) => {
    const hasSessions = item.sessionCount > 0;
    const state: WeekDay["state"] = hasSessions
      ? index === lastActiveIndex
        ? "active"
        : "filled"
      : "empty";

    const barHeight = hasSessions
      ? Math.max(20, Math.round((item.sessionCount / maxSessionCount) * 100))
      : null;

    return {
      date: item.date,
      label: weekdayLabelFromYmd(item.date),
      sessionCount: item.sessionCount,
      durationSeconds: item.durationSeconds,
      value: barHeight,
      valueLabel: hasSessions ? `${item.sessionCount}x` : "-",
      state,
    };
  });

  const activeDaysCount = days.filter((day) => day.sessionCount > 0).length;
  const totalSessions = days.reduce((sum, day) => sum + day.sessionCount, 0);

  return {
    title: "Konsistensi Latihan",
    targetLabel: `${activeDaysCount} dari 7 hari aktif • ${totalSessions} sesi`,
    targetConfig: { available: false, label: "Segera hadir" },
    weekLabel: "7 Hari Terakhir",
    days,
  };
}

export function toCoachNoteViewModel(dashboard: Dashboard): CoachNoteData {
  if (dashboard.latestCoachNote) {
    const note = dashboard.latestCoachNote;
    return {
      available: true,
      initials: getInitials(note.author.fullName),
      name: note.author.fullName,
      roleLabel: note.author.title ?? "Pelatih",
      publishedAtLabel: formatDateTimeId(note.publishedAt),
      quote: note.text,
    };
  }

  const review = dashboard.lastSession?.review;
  if (review?.note?.trim()) {
    return {
      available: true,
      initials: getInitials(review.author.fullName),
      name: review.author.fullName,
      roleLabel: review.author.title ?? "Pelatih",
      publishedAtLabel: formatDateTimeId(review.publishedAt),
      quote: review.note.trim(),
    };
  }

  if (dashboard.coach) {
    return {
      available: false,
      initials: getInitials(dashboard.coach.fullName),
      name: dashboard.coach.fullName,
      roleLabel: dashboard.coach.title ?? "Pelatih",
      quote: "Belum ada catatan terbaru dari pelatih.",
    };
  }

  return {
    available: false,
    initials: "—",
    name: "Pelatih Belum Ditugaskan",
    quote: "Belum ada catatan dari pelatih.",
  };
}

export function toMemberDashboardViewModel(
  dashboard: Dashboard,
  user?: AuthUser | null,
  now: Date = new Date(),
): MemberDashboardViewModel {
  return {
    greeting: toGreetingViewModel(dashboard, user, now),
    heroMetric: toHeroMetricViewModel(dashboard),
    pillars: toPillarStatsViewModel(dashboard),
    lastSession: toLastSessionViewModel(dashboard.lastSession),
    weekly: toWeeklyDataViewModel(dashboard, now),
    coachNote: toCoachNoteViewModel(dashboard),
  };
}
