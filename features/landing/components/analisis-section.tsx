import { ScanLine } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { SectionHeading } from "@/features/landing/components/shared/section-heading";
import { ImagePlaceholder } from "@/features/landing/components/shared/image-placeholder";

const stats = [
  { value: "33", label: "Titik landmark" },
  { value: "60FPS", label: "Pelacakan real-time" },
  { value: "175°", label: "Contoh sudut acuan" },
];

const steps = [
  {
    index: "01 // Input & Deteksi",
    chip: "33 Landmarking",
    chip2: "Vision Camera",
    title: "Tangkap Gerakan",
    description:
      "Kamera membaca postur tubuh dan memetakan titik persendian utama setiap frame latihan.",
  },
  {
    index: "02 // Komparasi Vektor",
    chip: "Acuan Gerakan",
    chip2: "Trigonometri Sudut",
    title: "Bandingkan Sudut",
    description:
      "Sudut sendi dihitung dan dibandingkan dengan acuan kurikulum resmi untuk tiap pilar gerakan.",
  },
  {
    index: "03 // Output Feedback",
    chip: "Catatan Pelatih",
    chip2: "Saran Perbaikan",
    title: "Terima Koreksi",
    description:
      "Dapatkan skor akurasi, bagian sendi yang keliru, dan cara membetulkannya secara instan.",
  },
];

export function AnalisisSection() {
  return (
    <section id="cara-kerja" aria-labelledby="analisis-heading" className="flex flex-col gap-4">
      <div id="analisis-heading">
        <SectionHeading
          eyebrow="Analisis Presisi"
          title="3-Tahap Koreksi Biomekanik"
          description="Sistem tidak hanya memberikan angka abstrak. SILATSENSE membedah setiap gerakan secara anatomis: apa yang keliru, di bagian sendi mana, dan bagaimana cara membetulkannya."
        />
      </div>
      <Card>
        <CardContent className="flex flex-col gap-3 p-4">
          <div>
            <h3 className="text-sm font-semibold">Pelacakan Landmark Pose</h3>
            <p className="text-xs text-muted-foreground">
              Rangka kerangka tubuh terdeteksi frame demi frame.
            </p>
          </div>
          <ImagePlaceholder label="Visualisasi wireframe pose" />
          <p className="flex items-center gap-1.5 rounded-full bg-destructive/10 px-3 py-1.5 text-xs font-medium text-destructive">
            <ScanLine className="size-3.5" /> Siku kanan kurang lurus 12° — perbaiki lintasan.
          </p>
          <dl className="grid grid-cols-3 gap-2">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="flex flex-col items-center gap-0.5 rounded-xl bg-muted px-2 py-2.5 text-center"
              >
                <dd className="font-heading text-base font-bold">{stat.value}</dd>
                <dt className="text-[11px] text-muted-foreground">{stat.label}</dt>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="flex flex-col gap-4 p-4">
          <h3 className="text-sm font-semibold">Analisis AI</h3>
          <ol className="flex list-none flex-col gap-4">
            {steps.map((step) => (
              <li key={step.index} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] font-bold tracking-widest text-muted-foreground uppercase">
                    {step.index}
                  </p>
                  <Badge variant="outline" className="rounded-full">
                    {step.chip}
                  </Badge>
                </div>
                <h4 className="text-sm font-semibold">{step.title}</h4>
                <p className="text-xs leading-relaxed text-muted-foreground">{step.description}</p>
                <Badge variant="secondary" className="w-fit rounded-full">
                  {step.chip2}
                </Badge>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </section>
  );
}
