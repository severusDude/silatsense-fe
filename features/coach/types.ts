import type { PilarSlug } from "@/components/shared/silat-reference";
import type { SessionViewModel } from "@/features/member/types";

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
  id: "total-atlet" | "akurasi-tim" | "sidang-uji" | "fokus";
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
  scoreLabel: string;
  lastGerakan: string;
  detailHref: string;
}

export interface CoachPillar {
  slug: PilarSlug;
  name: string;
  score: number | null;
  scoreLabel: string;
  sampleCount: number;
  sampleLabel: string;
  status: "terdata" | "belum-dinilai";
  statusLabel: string;
  statusVariant: CoachBadgeVariant;
  barPercent: number;
}

export interface PostureIssue {
  id: string;
  name: string;
  sessionCount: number;
  sessionLabel: string;
  statusLabel: "Terindikasi";
  statusVariant: "warning";
}

export interface CoachDashboardViewModel {
  stats: CoachDashboardStat[];
  athletes: CoachAthlete[];
  athleteCountLabel: string;
  pillars: CoachPillar[];
  posture: PostureIssue[];
  memberCount: number;
  reviewQueueCount: number;
  completedSessionCount: number;
  scoredSessionCount: number;
}

/** List + detail state badge, derived from session review status. */
export type CoachMemberStatus =
  | "belum-ada"
  | "diproses"
  | "menunggu"
  | "disetujui"
  | "perlu-revisi"
  | "gagal";

export interface CoachMemberStat {
  id: "total-atlet" | "akurasi-tim" | "sidang-uji" | "fokus";
  label: string;
  value: string;
  valueAvailable: boolean;
  badge?: string;
  badgeAvailable?: boolean;
  note?: string;
  noteAvailable?: boolean;
}

export interface CoachMemberListItem {
  id: string;
  initials: string;
  name: string;
  nim: string; // "—" when profile.npm is null
  status: CoachMemberStatus;
  statusLabel: string;
  statusVariant: CoachBadgeVariant;
  score: number | null;
  scoreLabel: string; // "80 poin" | "Belum dinilai"
  lastGerakan: string;
  detailHref: string;
}

export interface CoachMembersPageViewModel {
  stats: CoachMemberStat[];
  members: CoachMemberListItem[];
  memberCount: number;
  countLabel: string; // "5 Atlet" | "20 dari 24 Atlet"
  nextCursor: string | null;
  q: string;
}

export interface CoachMemberProfileViewModel {
  id: string;
  name: string;
  nim: string;
  status: CoachMemberStatus;
  statusLabel: string;
  statusVariant: CoachBadgeVariant;
  beltLabel: string;
  beltTargetLabel: string | null;
  attendance: { available: false; label: "Segera hadir" };
  aggregate: { available: false; label: "Segera hadir" };
  scoredSessionCount: number;
}

export interface CoachMemberPillarViewModel {
  slug: PilarSlug;
  name: string;
  score: number | null;
  scoreLabel: string; // "82 poin" | "Belum dinilai"
  sampleCount: number;
  sampleLabel: string; // "4 sesi dinilai" | "Multi-versi" | "Belum ada sesi"
  status: "terdata" | "belum-dinilai";
  statusLabel: "Terdata" | "Belum Dinilai";
  statusVariant: CoachBadgeVariant;
  barPercent: number;
}

export interface CoachMemberEvaluationViewModel {
  available: boolean;
  techniqueName: string;
  metaLabel: string;
  score: {
    available: boolean;
    value: number | null;
    label: string; // "80 poin" | "Belum dinilai"
    unitLabel: "poin";
    analysisStatusLabel: string | null;
    target: { available: false; label: "Segera hadir" };
    delta: { available: false; label: "Segera hadir" };
  };
  analysisMetrics: Array<{ label: string; value: string; sub: string }>;
  measurements: Array<{ id: string; label: string; value: string; sub: string }>;
  postures: Array<{
    id: string;
    name: string;
    status: "sesuai" | "perlu-koreksi" | "tidak-dinilai";
    statusLabel: string;
    reading: string;
    note: string | null;
  }>;
  session: SessionViewModel | null;
}

export interface CoachMemberHistoryItem {
  id: string;
  dateLabel: string;
  timeLabel: string;
  title: string;
  subtitle: string | null;
  score: number | null;
  scoreLabel: string; // "82 poin" | "Belum dinilai"
  status: CoachMemberStatus;
  statusLabel: string;
  statusVariant: CoachBadgeVariant;
}

export interface CoachMemberHistoryPageViewModel {
  memberId: string;
  items: CoachMemberHistoryItem[];
  nextCursor: string | null;
  limit: number;
}

export interface CoachMemberDetailViewModel {
  profile: CoachMemberProfileViewModel;
  pillars: CoachMemberPillarViewModel[];
  evaluation: CoachMemberEvaluationViewModel;
  history: CoachMemberHistoryItem[]; // 4 most recent
  feedback: {
    sessionId: string | null;
    sessionLabel: string | null;
    draftVersion: number;
    reviewRevision: number;
    decision: "approved" | "needs_revision" | null;
    note: string;
  };
}

export type AthleteStage = "remediasi" | "siap-tanding";
