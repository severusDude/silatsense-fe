import type { CoachStat, TeamMembers } from "@/features/coach/types";

// Placeholder values mirror Figma node 94:40178 (except trimmed subtitles + invented NIMs)
// until the backend lands.
export const dummyTeamMemberStats: CoachStat[] = [
  { id: "total-atlet", label: "Total Binaan", value: "5 Atlet", badge: "3 Siap • 2 Remediasi" },
  { id: "akurasi-tim", label: "Rata Akurasi", value: "84.6%", badge: "Target IPSI ≥ 85% (-0.4%)" },
  { id: "sidang-uji", label: "Kelulusan", value: "60%", note: "Memenuhi Standar" },
  { id: "fokus", label: "Sesi Rekaman", value: "24 Sesi", badge: "+3.8%", note: "Pekan Ini Tercatat" },
];

export const dummyTeamMembers: TeamMembers = {
  members: [
    { id: "aced-suryana", initials: "AS", name: "Aced Suryana", nim: "2307051", stage: "remediasi", stageLabel: "Tahap Remediasi", scorePct: 80, lastGerakan: "Kuda-kuda" },
    { id: "siti-nurhaliza", initials: "SN", name: "Siti Nurhaliza", nim: "2307052", stage: "remediasi", stageLabel: "Tahap Remediasi", scorePct: 76, lastGerakan: "Tendangan" },
    { id: "rian-mahendra", initials: "RM", name: "Rian Mahendra", nim: "2307053", stage: "siap", stageLabel: "Siap Tanding", scorePct: 94, lastGerakan: "Kuda-kuda" },
    { id: "fajar-pratama", initials: "FP", name: "Fajar Pratama", nim: "2307054", stage: "siap", stageLabel: "Siap Tanding", scorePct: 91, lastGerakan: "Pukulan" },
    { id: "dimas-wicaksono", initials: "DW", name: "Dimas Wicaksono", nim: "2307055", stage: "lolos", stageLabel: "Lolos Standar", scorePct: 88, lastGerakan: "Tangkisan" },
  ],
  totalAktif: 5,
};
