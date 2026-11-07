import type { MemberHistory } from "@/features/coach/types";

// Placeholder values mirror Figma node 94:40907 (full-frame screenshot; isolated
// sub-node renders are component defaults and not authoritative) until the backend lands.
export const dummyMemberHistory: Record<string, MemberHistory> = {
  "aced-suryana": {
    memberId: "aced-suryana",
    totalSessions: 24,
    pageSize: 10,
    sessions: [
      { id: "sesi-24", sesiLabel: "Sesi #24", dateLabel: "06 Mar 2026, 15:45 WIB", title: "Pukulan Lurus Depan", subtitle: "Penetapan Sasaran Target", repetisiLabel: "Repetisi: 42/50 (84%)", scorePct: 82, badgeKey: "remediasi" },
      { id: "sesi-23", sesiLabel: "Sesi #23", dateLabel: "03 Mar 2026, 15:30 WIB", title: "Tangkisan Lurus & Kuda-Kuda", subtitle: "Kombinasi Doktor Posisi (3)", repetisiLabel: "Repetisi: 36/40 (90%)", scorePct: 86.4, badgeKey: "sesuai" },
      { id: "sesi-22", sesiLabel: "Sesi #22", dateLabel: "28 Feb 2026, 15:10 WIB", title: "Kuda-kuda", subtitle: "Pertahanan Statis (Freestyle)", repetisiLabel: "Repetisi: 40/40 (100%)", scorePct: 92, badgeKey: "sesuai" },
      { id: "sesi-21", sesiLabel: "Sesi #21", dateLabel: "27 Feb 2026, 16:00 WIB", title: "Tendangan", subtitle: "Serangan Pukulan", repetisiLabel: "Repetisi: 36/40 (90%)", scorePct: 76.5, badgeKey: "tidak-sesuai" },
      { id: "sesi-20", sesiLabel: "Sesi #20", dateLabel: "20 Feb 2026, 15:45 WIB", title: "Pukulan Lurus Depan", subtitle: "Penetapan Sasaran Target", repetisiLabel: "Repetisi: 38/40 (95%)", scorePct: 81.2, badgeKey: "remediasi" },
      { id: "sesi-19", sesiLabel: "Sesi #19", dateLabel: "17 Feb 2026, 10:00 WIB", title: "Kuda-kuda", subtitle: "Pertahanan Statis (Front)", repetisiLabel: "Repetisi: 40/40 (100%)", scorePct: 94.5, badgeKey: "sesuai" },
      { id: "sesi-18", sesiLabel: "Sesi #18", dateLabel: "09 Feb 2026, 15:00 WIB", title: "Tangkisan Lurus & Terkait", subtitle: "Kuda-Kuda Terkunci", repetisiLabel: "Repetisi: 35/39 (89%)", scorePct: 88, badgeKey: "sesuai" },
      { id: "sesi-17", sesiLabel: "Sesi #17", dateLabel: "29 Jan 2026, 14:45 WIB", title: "Tendangan & Kelincahan", subtitle: "Kelincahan Gerak dan Otot", repetisiLabel: "Repetisi: 35/40 (87%)", scorePct: 76, badgeKey: "tidak-sesuai" },
      { id: "sesi-16", sesiLabel: "Sesi #16", dateLabel: "27 Jan 2026, 15:30 WIB", title: "Pukulan Tungkai & Passer Siku", subtitle: "Perisai Serangan", repetisiLabel: "Repetisi: 40/40 (95%)", scorePct: 85.5, badgeKey: "sesuai" },
      { id: "sesi-15", sesiLabel: "Sesi #15", dateLabel: "24 Jan 2026, 15:30 WIB", title: "Kuda-kuda", subtitle: "Kekuatan Tumpuan", repetisiLabel: "Repetisi: 50/50 (100%)", scorePct: 95.5, badgeKey: "sesuai" },
      { id: "sesi-14", sesiLabel: "Sesi #14", dateLabel: "17 Jan 2026, 10:15 WIB", title: "Pukulan Lurus Depan", subtitle: "Penetapan Sasaran Target", repetisiLabel: "Repetisi: 41/50 (82%)", scorePct: 83.1, badgeKey: "sesuai" },
      { id: "sesi-13", sesiLabel: "Sesi #13", dateLabel: "10 Jan 2026, 15:20 WIB", title: "Tendangan Sabit", subtitle: "Lintasan Serangan", repetisiLabel: "Repetisi: 30/40 (75%)", scorePct: 72.4, badgeKey: "tidak-sesuai" },
      { id: "sesi-12", sesiLabel: "Sesi #12", dateLabel: "03 Jan 2026, 15:05 WIB", title: "Kuda-kuda", subtitle: "Kestabilan Sumbu", repetisiLabel: "Repetisi: 45/50 (90%)", scorePct: 88.9, badgeKey: "sesuai" },
      { id: "sesi-11", sesiLabel: "Sesi #11", dateLabel: "27 Des 2025, 15:40 WIB", title: "Tangkisan Lurus", subtitle: "Reaksi Serangan", repetisiLabel: "Repetisi: 34/40 (85%)", scorePct: 80.7, badgeKey: "remediasi" },
      { id: "sesi-10", sesiLabel: "Sesi #10", dateLabel: "20 Des 2025, 15:25 WIB", title: "Pukulan Lurus Depan", subtitle: "Penetapan Sasaran Target", repetisiLabel: "Repetisi: 39/50 (78%)", scorePct: 78.3, badgeKey: "tidak-sesuai" },
      { id: "sesi-9", sesiLabel: "Sesi #09", dateLabel: "13 Des 2025, 15:50 WIB", title: "Kuda-kuda", subtitle: "Pertahanan Statis (Freestyle)", repetisiLabel: "Repetisi: 48/50 (96%)", scorePct: 91.6, badgeKey: "sesuai" },
      { id: "sesi-8", sesiLabel: "Sesi #08", dateLabel: "06 Des 2025, 15:35 WIB", title: "Tendangan & Kelincahan", subtitle: "Kelincahan Gerak dan Otot", repetisiLabel: "Repetisi: 37/40 (93%)", scorePct: 87.2, badgeKey: "sesuai" },
      { id: "sesi-7", sesiLabel: "Sesi #07", dateLabel: "29 Nov 2025, 15:15 WIB", title: "Tangkisan Lurus & Kuda-Kuda", subtitle: "Kombinasi Dasar (2)", repetisiLabel: "Repetisi: 33/40 (83%)", scorePct: 79.8, badgeKey: "remediasi" },
      { id: "sesi-6", sesiLabel: "Sesi #06", dateLabel: "22 Nov 2025, 15:45 WIB", title: "Kuda-kuda", subtitle: "Kekuatan Tumpuan", repetisiLabel: "Repetisi: 50/50 (100%)", scorePct: 93.4, badgeKey: "sesuai" },
      { id: "sesi-5", sesiLabel: "Sesi #05", dateLabel: "15 Nov 2025, 15:10 WIB", title: "Pukulan Lurus Depan", subtitle: "Kecepatan Impak", repetisiLabel: "Repetisi: 31/50 (62%)", scorePct: 68.5, badgeKey: "tidak-sesuai" },
      { id: "sesi-4", sesiLabel: "Sesi #04", dateLabel: "08 Nov 2025, 15:30 WIB", title: "Tangkisan & Kuda-Kuda", subtitle: "Kombinasi Doktor Posisi (3)", repetisiLabel: "Repetisi: 38/40 (95%)", scorePct: 86.8, badgeKey: "sesuai" },
      { id: "sesi-3", sesiLabel: "Sesi #03", dateLabel: "01 Nov 2025, 15:20 WIB", title: "Kuda-kuda", subtitle: "Pertahanan Statis (Front)", repetisiLabel: "Repetisi: 44/50 (88%)", scorePct: 84.6, badgeKey: "sesuai" },
      { id: "sesi-2", sesiLabel: "Sesi #02", dateLabel: "25 Okt 2025, 15:40 WIB", title: "Tendangan", subtitle: "Serangan Pukulan", repetisiLabel: "Repetisi: 32/40 (80%)", scorePct: 77.9, badgeKey: "tidak-sesuai" },
      { id: "sesi-1", sesiLabel: "Sesi #01", dateLabel: "18 Okt 2025, 15:05 WIB", title: "Kuda-kuda", subtitle: "Kestabilan Sumbu", repetisiLabel: "Repetisi: 42/50 (84%)", scorePct: 82.5, badgeKey: "remediasi" },
    ],
  },
};
