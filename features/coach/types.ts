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
  id: "total-atlet" | "akurasi-tim" | "sidang-uji" | "fokus";
  label: string;
  value: string;
  badge?: string; // content pill (stats 1-2)
  note?: string; // content third line (stat 3: queue names)
  footerLeft?: string; // footer pair, justify-between (absent on fokus)
  footerRight?: string;
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
