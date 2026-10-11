import type {
  EvaluasiSlug,
  EvaluationSession,
  PostureAssessment,
} from "@/features/member/types";

const pukulanPostures: PostureAssessment[] = [
  {
    id: "bahu",
    name: "Bahu",
    status: "sesuai",
    statusLabel: "SESUAI",
    detail:
      "Sejajar horizontal, rileks, dan stabil mengalirkan tenaga linear tanpa ketegangan trapezius.",
  },
  {
    id: "siku-kanan",
    name: "Siku Kanan",
    status: "tidak-sesuai",
    statusLabel: "TIDAK SESUAI (142°)",
    detail:
      "Elevasi siku terlalu melebar keluar (sayap terbuka) sejauh +8 cm dari sumbu sagital tubuh.",
  },
  {
    id: "pinggul",
    name: "Pinggul",
    status: "sesuai",
    statusLabel: "SESUAI",
    detail:
      "Rotasi panggul mengunci sejajar poros kuda-kuda, pusat gravitasi simetris dan seimbang.",
  },
  {
    id: "lutut",
    name: "Lutut",
    status: "sesuai",
    statusLabel: "SESUAI (135°)",
    detail:
      "Fleksi lutut 135° kokoh, tumpuan kaki terdistribusi merata 50:50 tanpa pergeseran poros.",
  },
  {
    id: "pergelangan",
    name: "Pergelangan",
    status: "tidak-sesuai",
    statusLabel: "TIDAK SESUAI (+0.15S)",
    detail:
      "Pronasi kepalan terlambat +0.15 detik sebelum fase impak titik sasaran pada ulu hati.",
  },
];

function evaluasiSession(
  slug: EvaluasiSlug,
  techniqueName: string,
): EvaluationSession {
  return {
    slug,
    techniqueName,
    evaluatedAtLabel: "28 Sep 2026, 16:45 WIB",
    validReps: 12,
    deviatedReps: 3,
    qualityLabel: "1080p@60FPS",
    score: {
      value: 80,
      unit: "%",
      targetPct: 85,
      targetLabel: "Target Lulus Standar : ≥ 85%",
      deltaLabel: "Selisih -5%",
      alertLabel: "PERLU PERBAIKAN",
      summary:
        "2 dari 5 parameter anatomis membutuhkan penyesuaian: elevasi siku kanan (sayap terbuka) dan rotasi kepalan pergelangan tangan.",
    },
    postures: pukulanPostures.map((posture) => ({ ...posture })),
    videoStatus: "placeholder",
  };
}

export const evaluasiSlugs: readonly EvaluasiSlug[] = [
  "kuda-kuda",
  "pukulan",
  "tangkisan",
  "tendangan",
];

export const dummyEvaluasiBySlug: Record<EvaluasiSlug, EvaluationSession> = {
  "kuda-kuda": evaluasiSession("kuda-kuda", "Kuda-kuda"),
  pukulan: evaluasiSession("pukulan", "Pukulan Lurus Depan"),
  tangkisan: evaluasiSession("tangkisan", "Tangkisan"),
  tendangan: evaluasiSession("tendangan", "Tendangan"),
};
