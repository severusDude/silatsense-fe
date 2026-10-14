import type { PerformanceBadgeKey, PilarSlug, PostureParamId } from "@/components/shared/silat-reference";

export type AthleteStage = "siap" | "remediasi" | "lolos";

export interface CoachAthlete {
  id: string;
  initials: string;
  name: string;
  stage: AthleteStage;
  stageLabel: string;
  scorePct: number;
  lastGerakan: string;
}

export type PillarStatus = "stabil" | "optimal" | "deviasi" | "remediasi";

export interface CoachPillar {
  slug: PilarSlug;
  name: string;
  avgPct: number;
  status: PillarStatus;
  statusLabel: string;
}

export interface CoachStat {
  id: "total-atlet" | "akurasi-tim" | "sidang-uji" | "fokus";
  label: string;
  value: string;
  badge?: string; // content pill (stats 1-2)
  note?: string; // content third line (stat 3: queue names)
  footerLeft?: string; // footer pair, justify-between (absent on fokus)
  footerRight?: string;
}

export interface PosturePoint {
  id: PostureParamId;
  name: string;
  scorePct: number;
  statusLabel: string;
  warning?: boolean;
}

export interface CoachOverview {
  stats: CoachStat[];
  athletes: CoachAthlete[];
  pillars: CoachPillar[];
  posture: PosturePoint[];
  reviewQueue: string[];
  teamAccuracyPct: number;
  accuracyTargetPct: number;
}

export interface TeamMember {
  id: string;
  initials: string;
  name: string;
  nim: string;
  stage: AthleteStage;
  stageLabel: string;
  scorePct: number;
  lastGerakan: string;
}

export interface TeamMembers {
  members: TeamMember[];
  totalAktif: number;
}

export interface PilarPerformance {
  slug: PilarSlug;
  name: string;
  scorePct: number;
  badgeKey: PerformanceBadgeKey;
}

export interface PostureParam {
  id: PostureParamId;
  name: string;
  badgeKey: PerformanceBadgeKey;
  note: string;
}

export interface LatestEvaluation {
  technique: string;
  metaLabel: string;
  bigScorePct: number;
  targetValue: string;
  deltaValue: string;
  metrics: { label: string; value: string; sub: string }[];
  quickStats: { label: string; value: string; sub: string }[];
  postures: PostureParam[];
}

export interface HistorySession {
  id: string;
  sesiLabel: string;
  dateLabel: string;
  title: string;
  repetisiLabel: string;
  scorePct: number;
  badgeKey: PerformanceBadgeKey;
}

export interface MemberDetail {
  id: string;
  name: string;
  nim: string;
  stateKey: PerformanceBadgeKey;
  beltLabel: string;
  attendanceLabel: string;
  aggregatePct: number;
  aggregateKey: PerformanceBadgeKey;
  pilares: PilarPerformance[];
  evaluation: LatestEvaluation;
  history: HistorySession[];
}

export interface FeedbackInput {
  memberId: string;
  message: string;
}

export interface FeedbackResult {
  memberId: string;
  status: "draft" | "sent";
  echo: string;
}
