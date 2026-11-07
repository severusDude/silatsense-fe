import type {
  ActivitySummary,
  CoachOverview as CoachOverviewDto,
  IssueCount,
  RosterPage,
} from "@/api";
import { formatScore, humanizeIdentifier } from "@/features/member/data/format";
import {
  PILAR_NAMES,
  type PilarSlug,
  getInitials,
} from "@/components/shared/silat-reference";
import { toHistoryReviewBadgeStatus } from "@/features/member/data/history-mapper";
import type {
  CoachAthlete,
  CoachAthleteStatus,
  CoachBadgeVariant,
  CoachDashboardStat,
  CoachDashboardViewModel,
  CoachPillar,
  PostureIssue,
} from "@/features/coach/types";

const CANONICAL_PILLARS: readonly PilarSlug[] = [
  "kuda-kuda",
  "tangkisan",
  "pukulan",
  "tendangan",
] as const;

export function toCoachStats(overview: CoachOverviewDto): CoachDashboardStat[] {
  const topIssue = overview.topIssues && overview.topIssues.length > 0 ? overview.topIssues[0] : null;

  return [
    {
      id: "total-atlet",
      label: "Total Atlet",
      value: `${overview.memberCount} Atlet`,
      valueAvailable: true,
      badge: "Rincian tahap: Segera hadir",
      badgeAvailable: false,
      footerLeft: "Ketuntasan",
      footerRight: "Segera hadir",
      footerRightAvailable: false,
    },
    {
      id: "akurasi-tim",
      label: "Akurasi Tim",
      value: "Segera hadir",
      valueAvailable: false,
      badge: "Target ≥ 85%",
      badgeAvailable: false,
      footerLeft: "Sesi Dinilai",
      footerRight: String(overview.statistics?.scoredSessionCount ?? 0),
      footerRightAvailable: true,
    },
    {
      id: "sidang-uji",
      label: "Ulasan Tertunda",
      value: `${overview.reviewQueueCount} Antrean`,
      valueAvailable: true,
      note: "Nama antrean: Segera hadir",
      noteAvailable: false,
      footerLeft: "Total Sesi",
      footerRight: String(overview.statistics?.completedSessionCount ?? 0),
      footerRightAvailable: true,
    },
    {
      id: "fokus",
      label: "Isu Teratas",
      value: topIssue ? humanizeIdentifier(topIssue.feature) : "Belum ada isu",
      valueAvailable: topIssue !== null,
      note: topIssue ? `${topIssue.sessionCount} sesi terindikasi` : undefined,
      noteAvailable: topIssue !== null ? true : undefined,
    },
  ];
}

export function toCoachAthletes(
  roster: RosterPage | null,
  memberCount: number,
): { athletes: CoachAthlete[]; athleteCountLabel: string } {
  const items = roster?.items ?? [];
  const athleteCountLabel =
    items.length < memberCount
      ? `${items.length} dari ${memberCount} Atlet`
      : `${memberCount} Atlet`;

  const athletes: CoachAthlete[] = items.map((item) => {
    const profile = item.profile;
    const latestSession = item.latestSession;

    let status: CoachAthleteStatus;
    let statusLabel: string;
    let statusVariant: CoachBadgeVariant;
    let score: number | null = null;
    let scoreLabel = "Belum dinilai";
    let lastGerakan = "Belum ada sesi";

    if (!latestSession) {
      status = "belum-ada";
      statusLabel = "Belum Ada Sesi";
      statusVariant = "outline";
    } else {
      score = latestSession.score;
      if (score !== null) {
        scoreLabel = `${formatScore(score)} poin`;
      }
      const movementSlug = latestSession.session?.movementSlug as PilarSlug | undefined;
      const fallbackMovement = movementSlug && PILAR_NAMES[movementSlug] ? PILAR_NAMES[movementSlug] : "";
      lastGerakan = latestSession.movementName || fallbackMovement || "Belum ada sesi";

      const badge = toHistoryReviewBadgeStatus(
        latestSession.session?.reviewStatus,
        latestSession.session?.processingStatus,
      );

      switch (badge.status) {
        case "sesuai":
          status = "disetujui";
          statusLabel = "Disetujui";
          statusVariant = "success";
          break;
        case "perlu-koreksi":
          status = "perlu-revisi";
          statusLabel = "Perlu Revisi";
          statusVariant = "warning";
          break;
        case "gagal":
          status = "gagal";
          statusLabel = "Gagal";
          statusVariant = "destructive";
          break;
        case "diproses":
          status = "diproses";
          statusLabel = "Diproses";
          statusVariant = "secondary";
          break;
        case "menunggu":
        default:
          status = "menunggu";
          statusLabel = "Menunggu Ulasan";
          statusVariant = "secondary";
          break;
      }
    }

    return {
      id: profile.id,
      initials: getInitials(profile.fullName),
      name: profile.fullName,
      status,
      statusLabel,
      statusVariant,
      score,
      scoreLabel,
      lastGerakan,
      detailHref: `/coach/members/${profile.id}`,
    };
  });

  return { athletes, athleteCountLabel };
}

export function toCoachPillars(
  statistics: ActivitySummary | null | undefined,
): CoachPillar[] {
  return CANONICAL_PILLARS.map((slug) => {
    const allForSlug = (statistics?.similarityGroups ?? []).filter(
      (g) => g.movementSlug === slug,
    );
    const scoredMatches = allForSlug.filter(
      (g) => g.averageScore !== null && g.sampleCount > 0,
    );
    const totalSamples = allForSlug.reduce((sum, g) => sum + (g.sampleCount ?? 0), 0);

    if (scoredMatches.length === 1) {
      const group = scoredMatches[0];
      const score = group.averageScore!;
      return {
        slug,
        name: PILAR_NAMES[slug],
        score,
        scoreLabel: `${formatScore(score)} poin`,
        sampleCount: group.sampleCount,
        sampleLabel: `${group.sampleCount} sesi dinilai`,
        status: "terdata" as const,
        statusLabel: "Terdata",
        statusVariant: "success" as const,
        barPercent: Math.max(0, Math.min(100, score)),
      };
    }

    const isMultiple = allForSlug.length > 1;
    return {
      slug,
      name: PILAR_NAMES[slug],
      score: null,
      scoreLabel: "Belum dinilai",
      sampleCount: totalSamples,
      sampleLabel: isMultiple
        ? "Multi-versi"
        : totalSamples > 0
          ? `${totalSamples} sesi dinilai`
          : "Belum ada sesi",
      status: "belum-dinilai" as const,
      statusLabel: "Belum Dinilai",
      statusVariant: "outline" as const,
      barPercent: 0,
    };
  });
}

export function toPostureIssues(topIssues: IssueCount[] = []): PostureIssue[] {
  return (topIssues ?? []).map((issue) => ({
    id: issue.feature,
    name: humanizeIdentifier(issue.feature),
    sessionCount: issue.sessionCount,
    sessionLabel: `${issue.sessionCount} sesi`,
    statusLabel: "Terindikasi" as const,
    statusVariant: "warning" as const,
  }));
}

export function toCoachDashboardViewModel(
  overview: CoachOverviewDto,
  roster: RosterPage | null,
): CoachDashboardViewModel {
  const stats = toCoachStats(overview);
  const { athletes, athleteCountLabel } = toCoachAthletes(roster, overview.memberCount);
  const pillars = toCoachPillars(overview.statistics);
  const posture = toPostureIssues(overview.topIssues);

  return {
    stats,
    athletes,
    athleteCountLabel,
    pillars,
    posture,
    memberCount: overview.memberCount,
    reviewQueueCount: overview.reviewQueueCount,
    completedSessionCount: overview.statistics?.completedSessionCount ?? 0,
    scoredSessionCount: overview.statistics?.scoredSessionCount ?? 0,
  };
}
