import type { CoachOverview } from "@/features/coach/types";

// Placeholder values mirror Figma node 94:37791 verbatim until the backend lands.
export const dummyCoachOverview: CoachOverview = {
  stats: [
    { id: "total-atlet", label: "Total Atlet", value: "5 Atlet", context: "Ketuntasan 60%", badge: "3 Siap 2 Remediasi" },
    { id: "akurasi-tim", label: "Rata-rata Akurasi Tim", value: "84.6%", context: "24 Sesi · +3.8%", badge: "Target ≥ 85% (-0.4%)" },
    { id: "antrean", label: "Antrean Sidang & Evaluasi", value: "2 Sesi", context: "Uji Baca Gerakan" },
    { id: "fokus", label: "Fokus Perbaikan Utama", value: "Elevasi Siku", context: "+8 cm sayap (142°) · Drill: Rib-Slide Punch" },
  ],
  athletes: [
    { id: "aced-suryana", initials: "AS", name: "Aced Suryana", stage: "remediasi", stageLabel: "Tahap Remediasi", scorePct: 80, lastGerakan: "Kuda-kuda" },
    { id: "siti-nurhaliza", initials: "SN", name: "Siti Nurhaliza", stage: "remediasi", stageLabel: "Tahap Remediasi", scorePct: 76, lastGerakan: "Tendangan" },
    { id: "rian-mahendra", initials: "RM", name: "Rian Mahendra", stage: "siap", stageLabel: "Siap Tanding", scorePct: 94, lastGerakan: "Kuda-kuda" },
    { id: "fajar-pratama", initials: "FP", name: "Fajar Pratama", stage: "siap", stageLabel: "Siap Tanding", scorePct: 91, lastGerakan: "Pukulan" },
    { id: "dimas-wicaksono", initials: "DW", name: "Dimas Wicaksono", stage: "lolos", stageLabel: "Lolos Standar", scorePct: 88, lastGerakan: "Tangkisan" },
  ],
  pillars: [
    { slug: "kuda-kuda", name: "Kuda-kuda", avgPct: 94.8, status: "stabil", statusLabel: "Stabil" },
    { slug: "tangkisan", name: "Tangkisan", avgPct: 89.0, status: "optimal", statusLabel: "Optimal" },
    { slug: "pukulan", name: "Pukulan", avgPct: 82.0, status: "deviasi", statusLabel: "Deviasi Siku" },
    { slug: "tendangan", name: "Tendangan", avgPct: 78.0, status: "remediasi", statusLabel: "Remediasi" },
  ],
  posture: [
    { id: "bahu-leher", name: "1. Bahu & Leher", scorePct: 92, statusLabel: "Sesuai" },
    { id: "siku-kanan", name: "2. Siku Kanan", scorePct: 64, statusLabel: "Deviasi", warning: true },
    { id: "torsi-pinggul", name: "3. Torsi Pinggul", scorePct: 88, statusLabel: "Sesuai" },
    { id: "fleksi-lutut", name: "4. Fleksi Lutut", scorePct: 91, statusLabel: "Sesuai" },
    { id: "pronasi-pergelangan", name: "5. Pronasi Pergelangan", scorePct: 58, statusLabel: "Terdeteksi (+10.5°)", warning: true },
  ],
  reviewQueue: ["Aced S.", "Siti N."],
  teamAccuracyPct: 84.6,
  accuracyTargetPct: 85,
};
