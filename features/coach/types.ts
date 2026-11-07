import type { PerformanceBadgeKey, PilarSlug, PostureParamId } from "@/components/shared/silat-reference";

export type AthleteStage = "siap" | "remediasi" | "lolos";

export type CoachAthleteStatus =
  | "belum-ada"
  | "diproses"
  | "menunggu"
  | "disetujui"
  | "perlu-revisi"
  | "gagal";

export type CoachBadgeVariant =
  | "default"
  | "secondary"
  | "destructive"
  | "outline"
  | "success"
  | "warning";

export interface CoachDashboardStat {
  id: "total-atlet" | "akurasi-tim" | "sidang-uji" | "fokus"; // internal ids; labels are Ulasan Tertunda / Isu Teratas
  label: string;
  value: string;
  valueAvailable: boolean;
  badge?: string;
  badgeAvailable?: boolean;
  note?: string;
  noteAvailable?: boolean;
  footerLeft?: string;
  footerRight?: string;
  footerRightAvailable?: boolean;
}

export interface CoachAthlete {
  id: string;
  initials: string;
  name: string;
  status: CoachAthleteStatus;
  statusLabel: string;
  statusVariant: CoachBadgeVariant;
  score: number | null;
  scoreLabel: string; // "80 poin" | "Belum dinilai"
  lastGerakan: string;
  detailHref: string;
}

export interface CoachPillar {
  slug: PilarSlug;
  name: string;
  score: number | null;
  scoreLabel: string; // "94,8 poin" | "Belum dinilai"
  sampleCount: number;
  sampleLabel: string; // "12 sesi dinilai" | "Belum ada sesi" | "Multi-versi"
  status: "terdata" | "belum-dinilai";
  statusLabel: string; // "Terdata" | "Belum Dinilai"
  statusVariant: CoachBadgeVariant;
  barPercent: number; // 0..100
}

export interface PostureIssue {
  id: string; // topIssues[].feature
  name: string; // humanizeIdentifier(feature)
  sessionCount: number;
  sessionLabel: string; // "12 sesi"
  statusLabel: "Terindikasi";
  statusVariant: "warning";
}

export interface CoachDashboardViewModel {
  stats: CoachDashboardStat[];
  athletes: CoachAthlete[];
  athleteCountLabel: string; // "5 Atlet" | "5 dari 24 Atlet"
  pillars: CoachPillar[];
  posture: PostureIssue[];
  memberCount: number;
  reviewQueueCount: number;
  completedSessionCount: number;
  scoredSessionCount: number;
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

export interface HistoryPageSession {
  id: string;
  sesiLabel: string;
  dateLabel: string;
  title: string;
  subtitle: string;
  repetisiLabel: string;
  scorePct: number;
  badgeKey: PerformanceBadgeKey;
}

export interface MemberHistory {
  memberId: string;
  totalSessions: number;
  pageSize: number;
  sessions: HistoryPageSession[];
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
