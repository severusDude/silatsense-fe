export type FaqItem = {
  question: string;
  // TODO: replace lorem answers with UKM Silat UNSIL copy
  answer: string;
};

export const faqItems: FaqItem[] = [
  {
    question: "Apakah butuh kamera khusus atau sensor baju untuk menggunakan sistem ini?",
    answer:
      "Lorem ipsum dolor sit amet, cukup gunakan kamera HP atau laptop biasa tanpa perangkat tambahan.",
  },
  {
    question: "Apakah sistem ini khusus untuk mahasiswa Universitas Siliwangi?",
    answer:
      "Lorem ipsum dolor sit amet, kurikulum disusun untuk UKM Silat UNSIL namun terbuka untuk dipelajari umum.",
  },
  {
    question: "Bagaimana jika ruangan latihan saya memiliki pencahayaan minim?",
    answer:
      "Lorem ipsum dolor sit amet, pastikan area latihan terang dan seluruh tubuh terlihat jelas oleh kamera.",
  },
  {
    question: "Apakah sistem ini menggantikan peran pelatih silat fisik?",
    answer:
      "Lorem ipsum dolor sit amet, sistem membantu latihan mandiri dan pelatih tetap membimbing taktik serta evaluasi akhir.",
  },
];
