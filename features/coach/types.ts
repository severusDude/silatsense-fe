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
  slug: "kuda-kuda" | "tangkisan" | "pukulan" | "tendangan";
  name: string;
  avgPct: number;
  status: PillarStatus;
  statusLabel: string;
}

export interface CoachStat {
  id: "total-atlet" | "akurasi-tim" | "antrean" | "fokus";
  label: string;
  value: string;
  context: string;
  badge?: string;
}

export interface PosturePoint {
  id: "bahu-leher" | "siku-kanan" | "torsi-pinggul" | "fleksi-lutut" | "pronasi-pergelangan";
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
