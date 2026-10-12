import type { MemberDashboard } from "@/features/member/types";

// Placeholder values mirror Figma node 94:38108 verbatim until the backend lands.
export const dummyMemberDashboard: MemberDashboard = {
  greeting: { name: "Aced", lastSessionDaysAgo: 2, focusTechnique: "Pukulan Lurus" },
  heroMetric: { accuracyPct: 82, elbowToleranceDeg: 14, targetDeg: 8, cameraDistanceM: 2.5, cameraReady: true },
  pillars: [
    { slug: "kuda-kuda", name: "Kuda-kuda", status: "stabil", statusLabel: "Stabil", detail: "Tuntas 4/4 Variasi", avgPct: 94.8 },
    { slug: "pukulan", name: "Pukulan", status: "perlu-koreksi", statusLabel: "Perlu Koreksi", detail: "Pukulan Lurus", avgPct: 82.0, active: true },
    { slug: "tangkisan", name: "Tangkisan", status: "optimal", statusLabel: "Optimal", detail: "Tuntas 3/4 Variasi", avgPct: 89.5 },
    { slug: "tendangan", name: "Tendangan", status: "perlu-koreksi", statusLabel: "Perlu Koreksi", detail: "Harus Evaluasi", avgPct: 76.0 },
  ],
  lastSession: {
    technique: "Pukulan Lurus (Serangan Tangan)",
    time: "Kemarin, 16:40 WIB",
    reps: 30,
    scorePct: 82,
    scoreLabel: "Perlu Ditingkatkan",
    observations: [
      { tone: "good", title: "Keseimbangan Kaki & Kuda-kuda", body: "Pusat gravitasi stabil saat melepaskan serangan. Sudut lutut terjaga pada 135°." },
      { tone: "warning", title: "Ketinggian Siku Tangan", body: "Siku kanan turun 8 cm saat pelepasan pukulan, membuka celah di rusuk badan." },
      { tone: "neutral", title: "Rekomendasi Koreksi", body: "Pertahankan garis lurus dari bahu ke buku jari, putar pinggul 45° tepat saat benturan." },
    ],
  },
  weekly: {
    title: "Konsistensi Latihan",
    targetLabel: "Target: 4 dari 5 Hari Target",
    weekLabel: "Minggu Ke-3",
    days: [
      { label: "Sen", value: 88, state: "filled" },
      { label: "Sel", value: 92, state: "filled" },
      { label: "Rab", value: null, state: "rest" },
      { label: "Kam", value: 82, state: "active" },
      { label: "Jum", value: null, state: "empty" },
      { label: "Sab", value: null, state: "empty" },
      { label: "Min", value: null, state: "empty" },
    ],
  },
  coachNote: { initials: "KF", name: "Kang Fauzan", quote: "Postur kuda-kuda Aced sudah kokoh. Tingkatkan akselerasi pelepasan pukulan tanpa menurunkan siku pelindung." },
};
