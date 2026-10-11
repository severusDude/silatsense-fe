export type PillarStatus = "stabil" | "optimal" | "perlu-koreksi";
export type DayState = "filled" | "rest" | "empty" | "active";
export type ObservationTone = "good" | "warning" | "neutral";

export interface GreetingData {
  name: string;
  lastSessionDaysAgo: number;
  focusTechnique: string;
}

export interface HeroMetricData {
  accuracyPct: number;
  elbowToleranceDeg: number;
  targetDeg: number;
  cameraDistanceM: number;
  cameraReady: boolean;
}

export interface PillarStat {
  slug: "kuda-kuda" | "pukulan" | "tangkisan" | "tendangan";
  name: string;
  status: PillarStatus;
  statusLabel: string;
  detail: string;
  avgPct: number;
  active?: boolean;
}

export interface SessionObservation {
  tone: ObservationTone;
  title: string;
  body: string;
}

export interface LastSessionData {
  technique: string;
  time: string;
  reps: number;
  scorePct: number;
  scoreLabel: string;
  observations: SessionObservation[];
}

export interface WeekDay {
  label: string;
  value: number | null;
  state: DayState;
}

export interface WeeklyData {
  title: string;
  targetLabel: string;
  weekLabel: string;
  days: WeekDay[];
}

export interface CoachNoteData {
  initials: string;
  name: string;
  quote: string;
}

export interface MemberDashboard {
  greeting: GreetingData;
  heroMetric: HeroMetricData;
  pillars: PillarStat[];
  lastSession: LastSessionData;
  weekly: WeeklyData;
  coachNote: CoachNoteData;
}

export interface TrainingModule {
  slug: "kuda-kuda" | "pukulan" | "tangkisan" | "tendangan";
  order: number;
  orderLabel: string;
  name: string;
  levelLabel: string;
  description: string;
  estimateLabel?: string;
}

export interface TrainingHero {
  badges: string[];
  title: string;
  subtitle: string;
  sessionsLabel: string;
  accuracyLabel: string;
}

export interface MemberTraining {
  hero: TrainingHero;
  modules: TrainingModule[];
}

export type PersiapanSlug = "kuda-kuda" | "pukulan" | "tangkisan" | "tendangan";

export interface CalibrationCheck {
  title: string;
  detail: string;
  stateLabel: string;
}

export interface PostureGuide {
  term: string;
  detail: string;
}

export interface PersiapanDetail {
  slug: PersiapanSlug;
  eyebrow: string;
  accuracyLabel: string;
  accuracyValue: string;
  title: string;
  description: string;
  coachQuote: string;
  readinessLabel: string;
  checks: CalibrationCheck[];
  guides: PostureGuide[];
}

export interface CameraDevice {
  id: string;
  label: string;
  resolution: string;
  fps: number;
  latencyMs: number | null;
}

export interface RekamSession {
  slug: PersiapanSlug;
  trainingName: string;
  eyebrow: string;
  countdownSec: number;
  targetDurationSec: number;
  camera: CameraDevice;
}

export type SesiUploadState = "idle" | "uploading" | "failed" | "success";

export interface TrainingSession {
  slug: PersiapanSlug;
  trainingName: string;
  eyebrow: string;
  durationSec: number;
  durationLabel: string;
  recordedAtLabel: string;
  fileSizeLabel: string;
  camera: CameraDevice;
  videoStatus: "recorded";
}

export type EvaluasiSlug = PersiapanSlug;

export type PostureStatus = "sesuai" | "perlu-koreksi";

export interface PostureAssessment {
  id: "bahu" | "siku-kanan" | "pinggul" | "lutut" | "pergelangan";
  name: string;
  status: PostureStatus;
  statusLabel: string; // "SESUAI" | "PERLU KOREKSI" — status word only
  reading: string; // e.g. "142° → target 130–138°"
  detail: string;
  correctionCue: string; // e.g. "Tarik siku ~8 cm ke dalam." — empty on sesuai
  thumbnailLabel: string; // e.g. "Siku kanan"
  thumbnailSrc: null; // literal until the pose-render move binds a real asset
}

export interface KinematicScore {
  value: number;
  unit: "%";
  targetPct: number;
  targetLabel: string;
  deltaLabel: string;
  alertLabel: string;
  summary: string;
}

export interface EvaluationSession {
  slug: EvaluasiSlug;
  techniqueName: string;
  evaluatedAtLabel: string;
  validReps: number;
  deviatedReps: number;
  qualityLabel: string;
  score: KinematicScore;
  postures: PostureAssessment[];
  videoStatus: "placeholder";
}

export type RiwayatSlug = PersiapanSlug;

export type HistoryStatus = "sesuai" | "perlu-koreksi";

export interface RiwayatParam {
  id: "bahu" | "siku-kanan" | "pinggul" | "lutut" | "pergelangan";
  name: string;
  reading: string;
  deviated: boolean;
  actionLabel?: string;
}

export interface HistoryEntry {
  slug: RiwayatSlug;
  techniqueName: string;
  dateLabel: string;
  timeLabel: string;
  summary: string;
  status: HistoryStatus;
  statusLabel: string; // "Sesuai" | "Perlu Koreksi" — title-case, status word only
  scorePct: number;
  scoreCaption: string; // "Kinematika IPSI" | "Standar ≥85%"
  params: RiwayatParam[]; // length 5
  coachNote: string; // verdict only, no telemetry
}

export interface HistorySummary {
  totalSessionsLabel: string;
  sessionsDeltaLabel: string;
  avgAccuracyPct: number;
  accuracyNote: string;
  dominantFocus: string;
  dominantSessionsLabel: string;
  sensorHoursLabel: string;
  sensorNote: string;
}

export interface MemberHistory {
  summary: HistorySummary;
  entries: HistoryEntry[]; // length 4: kuda-kuda, pukulan, tangkisan, tendangan
}

export type SessionDecision = "menunggu" | "remidiasi";

export interface SessionPillar {
  id: "kuda-kuda" | "tangkisan" | "pukulan" | "tendangan";
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

export interface SessionDetail {
  id: string;
  techniqueName: string;
  techniqueDesc: string;
  coach: { initials: string; name: string; role: string };
  decision: SessionDecision;
  decisionLabel: string;
  decidedAtLabel?: string;
  focusTechnique?: string;
  scorePct: number;
  targetPct: number;
  pillars: SessionPillar[];
  video: SessionVideo;
  postures: PostureAssessment[];
  retestLabel: string;
  retestValue: string;
}
