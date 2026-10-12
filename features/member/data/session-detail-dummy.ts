import type { SessionDetail } from "@/features/member/types";

const sharedPillars: SessionDetail["pillars"] = [
  { id: "kuda-kuda", name: "Kuda-kuda", detail: "Tengah", scorePct: 91, stageLabel: "Lolos", badge: "success" },
  { id: "tangkisan", name: "Tangkisan", detail: "Atas", scorePct: 86, stageLabel: "Lolos", badge: "success" },
  { id: "pukulan", name: "Pukulan", detail: "Lurus Depan", scorePct: 80, stageLabel: "Fokus", badge: "destructive" },
  { id: "tendangan", name: "Tendangan", detail: "Lurus", scorePct: 76, stageLabel: "Remidi", badge: "warning" },
];

function baseSession(): Omit<SessionDetail, "id" | "decision" | "postures" | "decidedAtLabel" | "focusTechnique"> {
  return {
    techniqueName: "Pukulan Lurus Depan (Tusuk/Lurus)",
    techniqueDesc: "Jurusan Serang Lurus Lintasan Ulu Hati",
    coach: {
      initials: "KF",
      name: "Kang Fauzan Azhiim, S.Pd.",
      role: "Pelatih Kepala UKM Pencak Silat UNSIL",
    },
    decisionLabel: "Menunggu",
    scorePct: 80,
    targetPct: 85,
    pillars: sharedPillars.map((pillar) => ({ ...pillar })),
    video: {
      status: "placeholder",
      cameraLabel: "Kamera 01: Multi-Axis Front (Rep 11/15)",
      qualityLabel: "30 FPS • 1080p",
    },
    retestLabel: "Jadwal Uji Ulang:",
    retestValue: "Jumat, 2 Okt 2026 • Dojo UNSIL",
  };
}

export const beforeSessionDetail: SessionDetail = {
  ...baseSession(),
  id: "pukulan-menunggu",
  decision: "menunggu",
  postures: [],
};

export const afterSessionDetail: SessionDetail = {
  ...baseSession(),
  id: "pukulan-remidiasi",
  decision: "remidiasi",
  decidedAtLabel: "28 Sep 2026, 17:30",
  focusTechnique: "Pukulan Lurus Depan",
  postures: [
    {
      id: "bahu",
      name: "Bahu",
      status: "sesuai",
      statusLabel: "Sesuai",
      reading: "Sejajar (target netral)",
      detail: "Bahu sudah bagus, sejajar dan rileks. Tenaga linear tersalur lancar tanpa tegang di leher.",
      correctionCue: "",
      thumbnailLabel: "Bahu",
      thumbnailSrc: null,
    },
    {
      id: "siku-kanan",
      name: "Siku Kanan",
      status: "perlu-koreksi",
      statusLabel: "Perlu Koreksi",
      reading: "142° → target 130–138°",
      detail: "Siku masih terbuka (flaring out 142°, melebar +8 cm). Tenaga pukulan buyar ke samping dan rawan diserang balik.",
      correctionCue: "Siku wajib menempel bidang koronal rusuk hingga 80% lintasan pukulan.",
      thumbnailLabel: "Siku kanan",
      thumbnailSrc: null,
    },
    {
      id: "pinggul",
      name: "Pinggul",
      status: "sesuai",
      statusLabel: "Sesuai",
      reading: "Terkunci (target simetris)",
      detail: "Rotasi panggul mengunci pas saat impak, pertahankan kuncian torsi ini.",
      correctionCue: "",
      thumbnailLabel: "Pinggul",
      thumbnailSrc: null,
    },
    {
      id: "lutut",
      name: "Lutut",
      status: "sesuai",
      statusLabel: "Sesuai",
      reading: "135° (target 130–138°)",
      detail: "Kuda-kuda tumpuan seimbang 50:50, fleksi lutut kokoh.",
      correctionCue: "",
      thumbnailLabel: "Lutut",
      thumbnailSrc: null,
    },
    {
      id: "pergelangan",
      name: "Pergelangan",
      status: "perlu-koreksi",
      statusLabel: "Perlu Koreksi",
      reading: "+0,15 dtk → target ≤ 0,05 dtk",
      detail: "Rotasi pronasi kepalan terlambat 0.15 detik. Titik impak harus tepat di ulu hati dengan jemari terkunci rapat.",
      correctionCue: "Kunci kepalan 0,1 dtk lebih awal.",
      thumbnailLabel: "Pergelangan",
      thumbnailSrc: null,
    },
  ],
};

export const sessionDetailIds: readonly string[] = [
  beforeSessionDetail.id,
  afterSessionDetail.id,
];
