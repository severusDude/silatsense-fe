import type { MemberHistory } from "@/features/member/types";

export const dummyMemberHistory: MemberHistory = {
  summary: {
    totalSessionsLabel: "24 Sesi",
    sessionsDeltaLabel: "↗ +4 minggu ini",
    avgAccuracyPct: 84.6,
    accuracyNote: "Mendekati IPSI ≥85%",
    dominantFocus: "Kuda Kuda",
    dominantSessionsLabel: "12 Sesi terekam",
    sensorHoursLabel: "08j 45m",
    sensorNote: "Telemetri aktif",
  },
  entries: [
    {
      slug: "kuda-kuda",
      techniqueName: "Kuda Kuda (Pasang Rendah)",
      dateLabel: "26 SEP 2026",
      timeLabel: "09:15 WIB",
      summary:
        "Sudut lutut simetris 120°, distribusi bobot panggul 50:50 seimbang sempurna, postur tulang belakang tegak stabil.",
      status: "sesuai",
      statusLabel: "Sesuai",
      scorePct: 91,
      scoreCaption: "Kinematika IPSI",
      params: [
        { id: "bahu", name: "Bahu", reading: "Sesuai (Sejajar)", deviated: false },
        { id: "siku-kanan", name: "Siku Kanan", reading: "Sesuai (Terkunci)", deviated: false },
        { id: "pinggul", name: "Pinggul", reading: "Sesuai (Simetris 50:50)", deviated: false },
        { id: "lutut", name: "Lutut", reading: "Sesuai (Fleksi 120°)", deviated: false },
        { id: "pergelangan", name: "Pergelangan", reading: "Sesuai (Netral)", deviated: false },
      ],
      coachNote: "Pertahankan distribusi bobot 50:50 dan sudut lutut simetris.",
    },
    {
      slug: "pukulan",
      techniqueName: "Pukulan Lurus Depan",
      dateLabel: "28 SEP 2026",
      timeLabel: "16:45 WIB",
      summary:
        "Siku kanan (142°) & pergelangan tangan perlu koreksi deviasi sagital; bahu, pinggul, dan lutut telah sesuai standar.",
      status: "perlu-koreksi",
      statusLabel: "Perlu Koreksi",
      scorePct: 80,
      scoreCaption: "Standar ≥85%",
      params: [
        { id: "bahu", name: "Bahu", reading: "Sesuai (Sejajar)", deviated: false },
        { id: "siku-kanan", name: "Siku Kanan", reading: "Deviasi +8cm (142°)", deviated: true },
        { id: "pinggul", name: "Pinggul", reading: "Sesuai (Terkunci)", deviated: false },
        { id: "lutut", name: "Lutut", reading: "Sesuai (Fleksi 135°)", deviated: false },
        {
          id: "pergelangan",
          name: "Pergelangan",
          reading: "Pronasi Lambat",
          deviated: true,
          actionLabel: "Koreksi Rotasi",
        },
      ],
      coachNote:
        "Rapatkan siku kanan ke lintasan rusuk sebelum dilepaskan ke target untuk mengunci kinetik lurus.",
    },
    {
      slug: "tangkisan",
      techniqueName: "Tangkisan Atas (Tangkis Kepala / Gedig)",
      dateLabel: "24 SEP 2026",
      timeLabel: "15:30 WIB",
      summary:
        "Elevasi lengan 45° di atas kening sasaran, sudut lengan penangkis optimal menepis serangan vertikal.",
      status: "sesuai",
      statusLabel: "Sesuai",
      scorePct: 86,
      scoreCaption: "Kinematika IPSI",
      params: [
        { id: "bahu", name: "Bahu", reading: "Sesuai (Sejajar)", deviated: false },
        { id: "siku-kanan", name: "Siku Kanan", reading: "Sesuai (Terkunci)", deviated: false },
        { id: "pinggul", name: "Pinggul", reading: "Sesuai (Simetris)", deviated: false },
        { id: "lutut", name: "Lutut", reading: "Sesuai (Fleksi 135°)", deviated: false },
        { id: "pergelangan", name: "Pergelangan", reading: "Sesuai (Netral)", deviated: false },
      ],
      coachNote: "Pertahankan elevasi lengan 45° di atas kening sasaran.",
    },
    {
      slug: "tendangan",
      techniqueName: "Tendangan",
      dateLabel: "21 SEP 2026",
      timeLabel: "17:00 WIB",
      summary:
        "Ketinggian tumit optimal menembus ulu hati sasaran, namun tumpuan kaki belakang sedikit bergeser dari poros.",
      status: "perlu-koreksi",
      statusLabel: "Perlu Koreksi",
      scorePct: 76,
      scoreCaption: "Standar ≥85%",
      params: [
        { id: "bahu", name: "Bahu", reading: "Sesuai (Sejajar)", deviated: false },
        { id: "siku-kanan", name: "Siku Kanan", reading: "Sesuai (Terkunci)", deviated: false },
        { id: "pinggul", name: "Pinggul", reading: "Pergeseran poros +5cm", deviated: true },
        { id: "lutut", name: "Lutut", reading: "Sesuai (Fleksi 135°)", deviated: false },
        { id: "pergelangan", name: "Pergelangan", reading: "Sesuai (Netral)", deviated: false },
      ],
      coachNote: "Kunci tumpuan kaki belakang agar poros tidak bergeser.",
    },
  ],
};
