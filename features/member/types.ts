import type { PilarSlug } from "@/components/shared/silat-reference";
import type { NormalizedApiError } from "@/lib/api-client";

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: NormalizedApiError };

export type TrainingModuleSlug =
  | "kuda-kuda"
  | "pukulan"
  | "tangkisan"
  | "tendangan";

export type PillarStatus =
  | "stabil"
  | "optimal"
  | "perlu-koreksi"
  | "terdata"
  | "belum-dinilai";
export type DayState = "filled" | "rest" | "empty" | "active";
export type ObservationTone = "good" | "warning" | "neutral";

export interface GreetingData {
  name: string;
  lastSessionDaysAgo: number | null;
  lastSessionRecencyLabel: string;
  focusSlug: TrainingModuleSlug;
  focusTechnique: string;
  hasRecordedSession: boolean;
}

export interface HeroMetricData {
  statusLabel: string;
  statusVariant: "success" | "secondary" | "outline";
  scoreAvailable: boolean;
  scoreValue: number | null;
  scoreLabel: string;
  scoreSubtitle: string;
  completedSessionsLabel: string;
  totalDurationLabel: string;
  compositeAccuracy: { available: false; label: "Segera hadir" };
  sensorTelemetry: { available: false; label: "Segera hadir" };
}

export interface PillarStat {
  slug: TrainingModuleSlug;
  name: string;
  status: PillarStatus;
  statusLabel: string;
  detail: string;
  scoreAvailable: boolean;
  avgScore: number | null;
  avgLabel: string;
  sampleCount: number;
  active?: boolean;
  href: string;
}

export interface SessionObservation {
  tone: ObservationTone;
  title: string;
  body: string;
}

export interface LastSessionData {
  id: string;
  slug: TrainingModuleSlug;
  technique: string;
  time: string;
  durationLabel: string;
  reps: { available: false; label: "Segera hadir" };
  scoreAvailable: boolean;
  scoreValue: number | null;
  badgeLabel: string;
  badgeVariant: "success" | "warning" | "secondary" | "outline" | "destructive";
  observations: SessionObservation[];
  retryHref: string;
  detailHref: string;
}

export interface WeekDay {
  date: string;
  label: string;
  sessionCount: number;
  durationSeconds: number;
  value: number | null;
  valueLabel: string;
  state: DayState;
}

export interface WeeklyData {
  title: string;
  targetLabel: string;
  targetConfig: { available: false; label: "Segera hadir" };
  weekLabel: string;
  days: WeekDay[];
}

export interface CoachNoteData {
  available: boolean;
  initials: string;
  name: string;
  roleLabel?: string;
  publishedAtLabel?: string;
  quote: string;
}

export interface MemberDashboardViewModel {
  greeting: GreetingData;
  heroMetric: HeroMetricData;
  pillars: PillarStat[];
  lastSession: LastSessionData | null;
  weekly: WeeklyData;
  coachNote: CoachNoteData;
}

export type MemberDashboard = MemberDashboardViewModel;

export interface TrainingModuleViewModel {
  slug: TrainingModuleSlug;
  order: number;
  orderLabel: string;
  name: string;
  levelLabel: string;
  description: string;
  estimateLabel?: string;
  scoringAvailable: boolean;
  scoringReason: "reference_not_ready" | null;
  similarity: { averageScore: number; sampleCount: number } | null;
}

export interface TrainingCatalogViewModel {
  hero: {
    badges: string[];
    title: string;
    subtitle: string;
    completedSessionsLabel: string;
    scoredSessionsLabel: string;
    accuracy: { available: false; label: "Segera hadir" };
  };
  modules: TrainingModuleViewModel[];
}

export interface GuideItemViewModel {
  id: string;
  text: string;
  source: string;
}

export interface PersiapanViewModel {
  slug: TrainingModuleSlug;
  eyebrow: string;
  title: string;
  description: string;
  levelLabel: string;
  estimatedDurationLabel?: string;
  capability: {
    scoringAvailable: boolean;
    reason: "reference_not_ready" | null;
    method: "static-reference-pose";
    referenceVersions: string[];
  };
  checklist: GuideItemViewModel[];
  guides: GuideItemViewModel[];
}

export interface RekamViewModel {
  slug: TrainingModuleSlug;
  trainingName: string;
  eyebrow: string;
  countdownSec: number;
  targetDurationSec: number;
  maxDurationSec: number;
  maxBytes: number;
  acceptedMimeTypes: string[];
  retentionSeconds: number;
  scoringAvailable: boolean;
}

export type SessionMediaStatus =
  | "available"
  | "expired"
  | "deleted"
  | "unavailable";

export interface SessionViewModel {
  id: string;
  slug: TrainingModuleSlug;
  trainingName: string;
  eyebrow: string;
  processingStatus: "queued" | "processing" | "completed" | "failed";
  processingLabel: string;
  analysisStatus: string | null;
  analysisStatusLabel: string | null;
  evaluationId: string | null;
  canViewEvaluation: boolean;
  canRetryAnalysis: boolean;
  startedAtLabel: string;
  uploadedAtLabel: string;
  completedAtLabel: string;
  durationSec: number | null;
  durationLabel: string;
  byteSize: number | null;
  fileSizeLabel: string;
  resolutionLabel: string;
  formatLabel: string;
  mediaStatus: SessionMediaStatus;
  mediaStatusLabel: string;
  mediaExpiresAtLabel: string;
  error: { code: string; detail: string } | null;
  acknowledged: boolean;
  acknowledgedAtLabel: string;
  retryOf: string | null;
}

export type PostureStatusViewModel = "sesuai" | "perlu-koreksi" | "tidak-dinilai";

export interface PostureAssessmentViewModel {
  id: string;
  name: string;
  status: PostureStatusViewModel;
  statusLabel: string;
  reading: string;
  detail: string;
  correctionCue: string;
  thumbnailLabel: string;
  thumbnailSrc: null;
  deviation?: string;
  coachNote?: string | null;
  coachNeedsWork?: boolean;
}

export interface EvaluationScoreViewModel {
  available: boolean;
  value: number | null;
  unitLabel: "poin";
  max: 100;
  status:
    | "experimental"
    | "reference_not_ready"
    | "insufficient_pose"
    | "insufficient_features";
  statusLabel: string;
  reason: string | null;
  variantLabel: string | null;
  summary: string;
}

export interface EvaluationViewModel {
  id: string;
  sessionId: string;
  slug: TrainingModuleSlug;
  techniqueName: string;
  evaluatedAtLabel: string;
  framesProcessed: number;
  validPoseFrames: number;
  featuresCompared: number | null;
  poseStatus: "detected" | "not_detected";
  postureQualityLabel: string;
  repetitionCountingAvailable: false;
  score: EvaluationScoreViewModel;
  postures: PostureAssessmentViewModel[];
  unavailableReasons: string[];
  mediaStatus: SessionMediaStatus;
  mediaMetaLabel: string;
  acknowledged: boolean;
  acknowledgedAtLabel: string;
}

export type PersiapanSlug = TrainingModuleSlug;

export interface CameraDevice {
  id: string;
  label: string;
  resolution: string;
  fps: number;
  latencyMs: number | null;
}

export type CameraStatus = "idle" | "scanning" | "live" | "error";

export type RecorderPhase =
  | "idle"
  | "countdown"
  | "recording"
  | "recorded"
  | "uploading"
  | "failed";

/** Client-only recording result; never crosses the RSC boundary. */
export interface RecordedClip {
  blob: Blob;
  previewUrl: string;
  durationSec: number;
  byteSize: number;
  mimeType: string;
  fileName: string;
}

export type HistoryReviewBadgeStatus =
  | "sesuai" // reviewStatus === "approved"
  | "perlu-koreksi" // reviewStatus === "needs_revision"
  | "menunggu" // reviewStatus === "pending" && processingStatus === "completed"
  | "diproses" // processingStatus === "queued" | "processing"
  | "gagal"; // processingStatus === "failed"

export interface HistoryParamChipViewModel {
  id: string;
  name: string;
  reading: string;
  status: PostureStatusViewModel; // "sesuai" | "perlu-koreksi" | "tidak-dinilai"
  actionLabel?: string;
  deviated?: boolean;
}

export interface HistoryEntryViewModel {
  id: string; // session.id
  slug: TrainingModuleSlug;
  techniqueName: string;
  dateLabel: string;
  timeLabel: string;
  summary: string;
  status: HistoryReviewBadgeStatus;
  statusLabel: string;
  scoreAvailable: boolean;
  score: number | null;
  scoreLabel: string; // e.g. "80 poin" or "—"
  scoreCaption: string; // "Skor Kemiripan" or "Belum dinilai"
  params: HistoryParamChipViewModel[]; // from review.bodyAssessments (may be empty)
  coachNote: string | null;
  hasPublishedReview: boolean;
}

export interface HistorySummaryViewModel {
  totalSessionsLabel: string; // e.g. "24 Sesi"
  sessionsDeltaLabel: string; // e.g. "3 sesi minggu ini"
  accuracy: {
    available: false;
    label: "Segera hadir";
    note: string; // "Analisis gabungan belum tersedia"
  };
  dominantFocusLabel: string; // e.g. "Kuda-kuda" or "Belum ada"
  dominantSessionsLabel: string; // e.g. "12 sesi dinilai"
  durationHoursLabel: string; // e.g. "08j 45m"
  durationNoteLabel: string; // e.g. "24 sampel durasi"
}

export interface HistoryFiltersViewModel {
  movementSlug: TrainingModuleSlug | null;
  reviewStatus: "pending" | "needs_revision" | "approved" | null;
  processingStatus: "queued" | "processing" | "completed" | "failed" | null;
  cursor: string | null;
  limit: number;
}

export interface HistoryPageViewModel {
  items: HistoryEntryViewModel[];
  nextCursor: string | null;
  filters: HistoryFiltersViewModel;
}

export interface FollowUpTaskViewModel {
  id: string;
  sessionId: string;
  reviewId: string;
  authorName: string;
  instruction: string;
  status: "open" | "completed" | "dismissed";
  statusLabel: string;
  updatedAtLabel: string;
}

export interface PublishedNoteViewModel {
  id: string;
  authorName: string;
  text: string;
  publishedAtLabel: string;
}

export interface ReviewHistoryItemViewModel {
  id: string;
  revision: number;
  authorName: string;
  publishedAtLabel: string;
  decision: "approved" | "needs_revision";
  decisionLabel: string;
  note: string | null;
}

export interface SessionDetailViewModel {
  id: string;
  slug: TrainingModuleSlug;
  techniqueName: string;
  techniqueDesc: string;
  session: SessionViewModel;
  evaluation: EvaluationViewModel | null;
  coach: {
    assigned: boolean;
    initials: string;
    name: string;
    role: string;
  };
  reviewDecision: "pending" | "approved" | "needs_revision";
  reviewDecisionLabel: string; // "Menunggu Ulasan" | "Disetujui" | "Perlu Revisi"
  reviewRevision: number | null;
  decidedAtLabel: string | null;
  reviewNote: string | null;
  focusTechnique: string;
  score: {
    available: boolean;
    value: number | null;
    label: string; // e.g. "80 poin" | "Belum dinilai"
    unitLabel: "poin";
    analysisStatusLabel: string | null;
    passThreshold: { available: false; label: "Segera hadir" };
  };
  retestSchedule: {
    available: false;
    label: "Jadwal Uji Ulang:";
    value: "Segera hadir";
  };
  coachBodyAssessments: PostureAssessmentViewModel[];
  aiPostures: PostureAssessmentViewModel[];
  reviewHistory: ReviewHistoryItemViewModel[];
  legacyNotes: PublishedNoteViewModel[];
  followUpTasks: FollowUpTaskViewModel[];
}

// Aliases for backward compatibility
export type PostureStatus = "sesuai" | "perlu-koreksi";
export type PostureAssessment = PostureAssessmentViewModel;
export type RiwayatSlug = TrainingModuleSlug;
export type HistoryStatus = HistoryReviewBadgeStatus;
export type RiwayatParam = HistoryParamChipViewModel;
export type HistoryEntry = HistoryEntryViewModel;
export type HistorySummary = HistorySummaryViewModel;
export interface MemberHistory {
  summary: HistorySummaryViewModel;
  entries: HistoryEntryViewModel[];
}
export type SessionDecision = "pending" | "approved" | "needs_revision";
export interface SessionPillar {
  id: PilarSlug;
  name: string;
  detail: string;
  scorePct: number;
  stageLabel: "Lolos" | "Fokus" | "Remidi";
  badge: "success" | "destructive" | "warning";
}
export interface SessionVideo {
  status: "placeholder";
  cameraLabel: string;
  qualityLabel: string;
}
export type SessionDetail = SessionDetailViewModel;
