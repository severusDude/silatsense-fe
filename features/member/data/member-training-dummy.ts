import type { MemberTraining } from "@/features/member/types";

// Descriptions mirror Figma node 94:38430 verbatim. Order/level/estimate
// labels are best-effort transcriptions flagged "[transcribed — confirm]"
// in the spec; only the legible "10 Menit" estimate ships, the rest omit
// estimateLabel so no badge renders.
export const dummyMemberTraining: MemberTraining = {
  hero: {
    badges: ["MODUL LATIHAN", "Standar PB IPSI Resmi", "4 Pilar Teknik"],
    title: "Pilih Latihan Gerakan Dasar",
    subtitle:
      "Pilih salah satu dari 4 pilar teknik dasar pencak silat untuk memulai panduan gerak dan kalibrasi sensor biomekanika AI.",
    sessionsLabel: "26 Sesi Tersimpan",
    accuracyLabel: "Akurasi: 84.0%",
  },
  modules: [
    {
      slug: "kuda-kuda",
      order: 1,
      orderLabel: "Latihan 01 · Fondasi Inti",
      name: "Kuda-kuda",
      levelLabel: "Semua Tingkat Kemampuan",
      description:
        "Fondasi utama stabilitas tubuh, distribusi bobot simetris 50:50, serta kekuatan tumpuan paha dan lutut sejajar 135°.",
      estimateLabel: "10 Menit",
    },
    {
      slug: "pukulan",
      order: 2,
      orderLabel: "Latihan 02 · Serangan Tangan",
      name: "Pukulan",
      levelLabel: "Pukulan Dasar 3 Bentuk",
      description:
        "Melatih linearitas dorongan kepalan tangan segaris ulu hati, kekokohan Kuda Kuda (135°), dan efisiensi rotasi sendi panggul 45°.",
    },
    {
      slug: "tangkisan",
      order: 3,
      orderLabel: "Latihan 03 · Pertahanan",
      name: "Tangkisan",
      levelLabel: "Tangkisan Luar & Dalam",
      description:
        "Teknik menangkis serangan lawan dengan sudut perisai lengan 45° terhadap dahi serta menjaga elastisitas bahu dan leher tetap rileks.",
    },
    {
      slug: "tendangan",
      order: 4,
      orderLabel: "Latihan 04 · Serangan Kaki",
      name: "Tendangan",
      levelLabel: "Tendangan & Sabit",
      description:
        "Melatih daya dorong tumit/sabit, ketinggian lintasan ujung kaki, dan kelurusan sentakan sendi lutut tumpuan saat eksekusi.",
    },
  ],
};
