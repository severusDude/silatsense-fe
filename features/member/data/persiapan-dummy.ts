import type {
  CameraDevice,
  PersiapanDetail,
  PersiapanSlug,
} from "@/features/member/types";

// Kuda-kuda copy mirrors Figma node 94:38628 verbatim. Other slugs carry
// best-effort transcriptions derived from the list-move module copy, flagged
// "[transcribed — confirm]" in the spec. Sensor checks are identical across
// slugs: they describe device state, not module content.
const sharedChecks: PersiapanDetail["checks"] = [
  {
    title: "Izin & Sensor Kamera",
    detail: "Logitech Brio 4K / WebCam HD",
    stateLabel: "Aktif",
  },
  {
    title: "Pencahayaan Ruangan",
    detail: "540 Lux optimal & bebas backlight",
    stateLabel: "Optimal",
  },
  {
    title: "Jarak Pesilat",
    detail: "2.48 meter dari sensor",
    stateLabel: "2.5m Terkalibrasi",
  },
  {
    title: "Visibilitas Tubuh Penuh",
    detail: "33 titik persendian utuh",
    stateLabel: "Terkunci",
  },
];

export const persiapanSlugs: PersiapanSlug[] = [
  "kuda-kuda",
  "pukulan",
  "tangkisan",
  "tendangan",
];

// Fallback list shown before the user taps Pindai Ulang (probe-on-tap) and
// when camera access is denied or unavailable. Real devices replace it via
// enumerateDevices + getSettings probing in CameraSourceCard.
export const defaultCameraId = "integrated";

export const dummyCameras: CameraDevice[] = [
  {
    id: "integrated",
    label: "Kamera Terintegrasi",
    resolution: "1280×720",
    fps: 30,
    latencyMs: null,
  },
];

export const dummyPersiapanBySlug: Record<PersiapanSlug, PersiapanDetail> = {
  "kuda-kuda": {
    slug: "kuda-kuda",
    eyebrow: "KUDA-KUDA",
    accuracyLabel: "Target Akurasi:",
    accuracyValue: "≥ 88%",
    title: "Kuda-kuda",
    description:
      "Kalibrasi Pra-Latihan Biomekanika untuk mengukur simetri tumpuan kaki (50:50 COG), sudut fleksi lutut (130°–135°), dan tegak lurus sumbu aksial tulang belakang.",
    coachQuote:
      "Buka kedua kaki selebar dua kali bahu, rendahkan panggul sejajar, pastikan lutut menekan ke luar dan punggung tetap tegak saat mengambil posisi Kuda Kuda.",
    readinessLabel: "100% SIAP",
    checks: sharedChecks,
    guides: [
      { term: "Lebar Kaki:", detail: "Buka 2x lebar bahu simetris." },
      { term: "Fleksi Lutut:", detail: "Tekan keluar 130° – 135°." },
      { term: "Poros Tubuh:", detail: "Sumbu tulang belakang tegak 90°." },
    ],
  },
  pukulan: {
    slug: "pukulan",
    eyebrow: "PUKULAN",
    accuracyLabel: "Target Akurasi:",
    accuracyValue: "≥ 85%",
    title: "Pukulan",
    description:
      "Kalibrasi Pra-Latihan Biomekanika untuk mengukur linearitas dorongan kepalan (segaris ulu hati), stabilitas Kuda Kuda (135°), dan rotasi sendi panggul (45°).",
    coachQuote:
      "Dorong kepalan segaris ulu hati, kunci Kuda Kuda 135°, dan putar panggul 45° saat memukul.",
    readinessLabel: "100% SIAP",
    checks: sharedChecks,
    guides: [
      { term: "Lurus Dorongan:", detail: "Kepalan segaris ulu hati." },
      { term: "Tumpuan Kaki:", detail: "Kuda Kuda kokoh 135°." },
      { term: "Rotasi Panggul:", detail: "Putar efisien 45°." },
    ],
  },
  tangkisan: {
    slug: "tangkisan",
    eyebrow: "TANGKISAN",
    accuracyLabel: "Target Akurasi:",
    accuracyValue: "≥ 85%",
    title: "Tangkisan",
    description:
      "Kalibrasi Pra-Latihan Biomekanika untuk mengukur sudut perisai lengan (45° terhadap dahi), serta rileksasi bahu dan sumbu leher.",
    coachQuote:
      "Angkat lengan perisai 45° terhadap dahi, bahu dan leher tetap rileks saat menangkis.",
    readinessLabel: "100% SIAP",
    checks: sharedChecks,
    guides: [
      { term: "Sudut Perisai:", detail: "Lengan 45° terhadap dahi." },
      { term: "Bahu Rileks:", detail: "Jaga elastisitas bahu." },
      { term: "Leher Netral:", detail: "Kepala tegak, tatap lawan." },
    ],
  },
  tendangan: {
    slug: "tendangan",
    eyebrow: "TENDANGAN",
    accuracyLabel: "Target Akurasi:",
    accuracyValue: "≥ 85%",
    title: "Tendangan",
    description:
      "Kalibrasi Pra-Latihan Biomekanika untuk mengukur daya dorong tumit, ketinggian lintasan kaki, dan kelurusan lutut tumpuan.",
    coachQuote:
      "Dorong tumit bertenaga, jaga ketinggian lintasan kaki dan lutut tumpuan lurus saat menendang.",
    readinessLabel: "100% SIAP",
    checks: sharedChecks,
    guides: [
      { term: "Tumit Dorong:", detail: "Sentak tumit/sabit bertenaga." },
      { term: "Lintasan Kaki:", detail: "Ujung kaki setinggi target." },
      { term: "Lutut Tumpuan:", detail: "Kaki tumpuan lurus stabil." },
    ],
  },
};
