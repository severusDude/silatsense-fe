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
