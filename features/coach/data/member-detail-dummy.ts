import type { MemberDetail } from "@/features/coach/types";

// Placeholder values mirror Figma node 94:40427 (screenshot + metadata; pixel
// audit deferred) until the backend lands.
export const dummyMemberDetail: Record<string, MemberDetail> = {
  "aced-suryana": {
    id: "aced-suryana",
    name: "Aced Suryana",
    nim: "2307051",
    stateKey: "evaluasi",
    beltLabel: "Sabuk Kuning",
    attendanceLabel: "48 Sesi",
    aggregatePct: 82.4,
    aggregateKey: "remediasi",
    pilares: [
      { slug: "kuda-kuda", name: "Kuda-kuda", scorePct: 82, badgeKey: "sesuai" },
      { slug: "pukulan", name: "Pukulan Lurus", scorePct: 82, badgeKey: "remediasi" },
      { slug: "tangkisan", name: "Tangkisan", scorePct: 86, badgeKey: "sesuai" },
      { slug: "tendangan", name: "Tendangan", scorePct: 78, badgeKey: "remediasi" },
    ],
    evaluation: {
      technique: "Pukulan Lurus Depan",
      metaLabel: "28 Sep 2026, 16:45 WIB • Sesi Mandiri Sasana • 15 Repetisi",
      bigScorePct: 80,
      targetValue: "85%",
      deltaValue: "-5%",
      metrics: [
        { label: "Target IPSI", value: "85%", sub: "Selisih -5%" },
        { label: "Repetisi Sah", value: "12", sub: "dari 15 repetisi" },
        { label: "Kecepatan Puncak", value: "4,18", sub: "m/s saat impak" },
        { label: "Kestabilan Kuda-kuda", value: "88%", sub: "Sumbu terkunci" },
      ],
      quickStats: [
        { label: "Lintasan", value: "132cm", sub: "Tepat" },
        { label: "Sudut Siku", value: "142°", sub: "Melebar" },
        { label: "Rotasi Pinggul", value: "45°", sub: "Terkunci" },
        { label: "Fleksi Lutut", value: "135°", sub: "Kokoh" },
      ],
      postures: [
        { id: "bahu", name: "Bahu", badgeKey: "sesuai", note: "Sejajar horizontal, rileks saat dorong." },
        { id: "siku-kanan", name: "Siku Kanan", badgeKey: "tidak-sesuai", note: "Elevasi melebar keluar +8 cm sebelum ekstensi penuh." },
        { id: "pinggul", name: "Pinggul", badgeKey: "sesuai", note: "Rotasi panggul mengunci sejajar poros kuda-kuda." },
        { id: "lutut", name: "Lutut", badgeKey: "sesuai", note: "Fleksi lutut kokoh, tumpuan merata 50:50." },
        { id: "pergelangan", name: "Pergelangan", badgeKey: "remediasi", note: "Rotasi pronasi kepalan terlambat sebelum fase impak." },
      ],
    },
    history: [
      { id: "sesi-24", sesiLabel: "Sesi 24", dateLabel: "28 Sep 2026", title: "Pukulan Lurus Depan", repetisiLabel: "Repetisi: 42/50 (84%)", scorePct: 80, badgeKey: "remediasi" },
      { id: "sesi-23", sesiLabel: "Sesi 23", dateLabel: "21 Sep 2026", title: "Tangkisan Atas", repetisiLabel: "Repetisi: 38/40 (95%)", scorePct: 88, badgeKey: "sesuai" },
      { id: "sesi-22", sesiLabel: "Sesi 22", dateLabel: "14 Sep 2026", title: "Kuda-kuda", repetisiLabel: "Repetisi: 60/60 (100%)", scorePct: 91, badgeKey: "sesuai" },
      { id: "sesi-21", sesiLabel: "Sesi 21", dateLabel: "7 Sep 2026", title: "Tendangan Sabit", repetisiLabel: "Repetisi: 28/40 (70%)", scorePct: 70, badgeKey: "tidak-sesuai" },
    ],
  },
};
