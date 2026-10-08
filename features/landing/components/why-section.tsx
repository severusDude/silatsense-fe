import { Check, Clock, ShieldCheck, Target, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { SectionHeading } from "@/features/landing/components/shared/section-heading";

const benefits = [
  {
    icon: Target,
    title: "Akurasi Objektif 98%",
    description:
      "Berdasarkan kalkulasi matematis vektor sudut, bukan sekadar perkiraan kasat mata.",
  },
  {
    icon: Clock,
    title: "Hemat Waktu Evaluasi Pelatih",
    description:
      "Pelatih UKM fokus pada strategi taktik tanding, sedangkan fundamental dasar telah terasah mandiri.",
  },
  {
    icon: ShieldCheck,
    title: "Keamanan & Pencegahan Cidera",
    description:
      "Peringatan dini jika posisi lutut melebihi batas anatomis aman persendian.",
  },
];

const conventionalCons = [
  "Mengandalkan cermin dan tebakan visual pribadi.",
  "Koreksi hanya didapat seminggu sekali saat jadwal latihan rutin UKM.",
  "Tidak ada data kuantitatif kemajuan teknik.",
  "Risiko cedera ligamen lutut akibat sudut salah berkepanjangan.",
];

const silatSensePros = [
  "Pemetaan 33 titik persendian real-time.",
  "Feedback instan setiap detik saat repetisi.",
  "Skor persentase presisi & riwayat grafik.",
  "Peringatan batas biomekanik anatomis.",
];

export function WhySection() {
  return (
    <section aria-labelledby="why-heading" className="flex flex-col gap-4">
      <div id="why-heading">
        <SectionHeading
          eyebrow="Transformasi Pembelajaran"
          title="Mengapa Evaluasi Berbasis Visi Komputer?"
          description="Dalam latihan mandiri tanpa pelatih, pesilat pemula sering tidak menyadari kesalahan sudut kuda-kuda atau kelurusan pukulan. Kebiasaan salah yang berulang dapat memperlambat kemajuan teknik dan rawan cidera."
        />
      </div>
      <ul className="flex list-none flex-col gap-2">
        {benefits.map((benefit) => (
          <li key={benefit.title}>
            <Card>
              <CardContent className="flex items-start gap-3 p-4">
                <benefit.icon className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                <div className="flex flex-col gap-0.5">
                  <h3 className="text-xs font-bold">{benefit.title}</h3>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {benefit.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
      <div className="flex flex-col gap-2.5">
        <Card className="bg-muted">
          <CardContent className="flex flex-col gap-2 p-4">
            <h3 className="text-[11px] font-bold tracking-widest text-muted-foreground uppercase">
              Latihan Mandiri Konvensional
            </h3>
            <ul className="flex list-none flex-col gap-2">
              {conventionalCons.map((con) => (
                <li key={con} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <X className="mt-0.5 size-3.5 shrink-0" /> {con}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card className="relative border-primary/20">
          <CardContent className="flex flex-col gap-2 p-4">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-[11px] font-bold tracking-widest text-primary uppercase">
                Dengan SilatSense UNSIL
              </h3>
              <Badge className="rounded-full uppercase">Direkomendasikan</Badge>
            </div>
            <ul className="flex list-none flex-col gap-2">
              {silatSensePros.map((pro) => (
                <li key={pro} className="flex items-start gap-2 text-xs font-medium">
                  <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-600" /> {pro}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
