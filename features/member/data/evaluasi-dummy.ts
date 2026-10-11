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
    reading: "Sejajar (target netral)",
    detail:
      "Sejajar horizontal, rileks, dan stabil mengalirkan tenaga linear tanpa ketegangan trapezius.",
    correctionCue: "",
    thumbnailLabel: "Bahu",
    thumbnailSrc: null,
  },
  {
    id: "siku-kanan",
    name: "Siku Kanan",
    status: "perlu-koreksi",
    statusLabel: "PERLU KOREKSI",
    reading: "142° → target 130–138°",
    detail:
      "Elevasi siku terlalu melebar keluar (sayap terbuka) sejauh +8 cm dari sumbu sagital tubuh.",
    correctionCue: "Tarik siku ~8 cm ke dalam.",
    thumbnailLabel: "Siku kanan",
    thumbnailSrc: null,
  },
  {
    id: "pinggul",
    name: "Pinggul",
    status: "sesuai",
    statusLabel: "SESUAI",
    reading: "Terkunci (target simetris)",
    detail:
      "Rotasi panggul mengunci sejajar poros kuda-kuda, pusat gravitasi simetris dan seimbang.",
    correctionCue: "",
    thumbnailLabel: "Pinggul",
    thumbnailSrc: null,
  },
  {
    id: "lutut",
    name: "Lutut",
    status: "sesuai",
    statusLabel: "SESUAI",
    reading: "135° (target 130–138°)",
    detail:
      "Fleksi lutut 135° kokoh, tumpuan kaki terdistribusi merata 50:50 tanpa pergeseran poros.",
    correctionCue: "",
    thumbnailLabel: "Lutut",
    thumbnailSrc: null,
  },
  {
    id: "pergelangan",
    name: "Pergelangan",
    status: "perlu-koreksi",
    statusLabel: "PERLU KOREKSI",
    reading: "+0,15 dtk → target ≤ 0,05 dtk",
    detail:
      "Pronasi kepalan terlambat +0.15 detik sebelum fase impak titik sasaran pada ulu hati.",
    correctionCue: "Kunci kepalan 0,1 dtk lebih awal.",
    thumbnailLabel: "Pergelangan",
    thumbnailSrc: null,
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
      alertLabel: "PERLU KOREKSI",
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
