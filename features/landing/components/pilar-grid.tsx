import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { SectionHeading } from "@/features/landing/components/shared/section-heading";
import { ImagePlaceholder } from "@/features/landing/components/shared/image-placeholder";

type Pilar = {
  index: string;
  name: string;
  angle: string | null;
  description: string;
  tags: string[];
  cta: string;
};

const pilars: Pilar[] = [
  {
    index: "Pilar 01",
    name: "Kuda-kuda",
    angle: "Sudut: 110°-130°",
    description:
      "Tengah, Depan, Samping, dan Silang. Melatih pondasi tumpuan, keseimbangan pusat gravitasi tubuh, dan ketahanan otot paha.",
    tags: ["Center of Mass", "Sudut Paha", "Beban Lutut"],
    cta: "Latih Kuda-kuda",
  },
  {
    index: "Pilar 02",
    name: "Pukulan",
    angle: "Ekstensi: 175°",
    description:
      "Pukulan Lurus, Bandul, Tegak, dan Tebak. Fokus pada koordinasi putaran pinggul, rotasi bahu, dan lintasan tangan terkunci.",
    tags: ["Kecepatan Ayun", "Rotasi Pinggang"],
    cta: "Latih Pukulan",
  },
  {
    index: "Pilar 03",
    name: "Tangkisan",
    angle: "Proteksi: 90° Siku",
    description:
      "Tangkisan Atas, Bawah, Luar, dan Dalam. Memeriksa sudut bidang lindung tubuh dan posisi pergelangan tangan untuk mementalkan serangan lawan.",
    tags: ["Sudut Siku 90°", "Zona Defensif"],
    cta: "Latih Tangkisan",
  },
  {
    index: "Pilar 04",
    name: "Tendangan",
    angle: null,
    description:
      "Menganalisis stabilitas kaki tumpu, ketinggian lintasan ujung kaki, dan kelurusan hentakan sendi lutut.",
    tags: ["Kaki Tumpu", "Fleksibilitas"],
    cta: "Latih Tendangan",
  },
];

export function PilarGrid() {
  return (
    <section id="kurikulum" aria-labelledby="kurikulum-heading" className="flex flex-col gap-4">
      <div id="kurikulum-heading">
        <SectionHeading
          eyebrow="Kurikulum Terstandarisasi"
          title="4 Pilar Gerakan Dasar Silat"
          description="Materi kurikulum sabuk pemula UKM Pencak Silat Universitas Siliwangi yang dievaluasi dengan tolak ukur sudut mekanika tubuh resmi IPSI."
        />
      </div>
      <div className="flex flex-col gap-3.5">
        {pilars.map((pilar) => (
          <Card key={pilar.index} className="gap-0 overflow-hidden py-0">
            <div className="relative">
              <ImagePlaceholder label={pilar.name} className="rounded-none border-0" />
              <div className="absolute top-2.5 left-2.5">
                <Badge className="rounded-full uppercase">{pilar.index}</Badge>
              </div>
              {pilar.angle && (
                <div className="absolute right-2.5 bottom-2.5">
                  <Badge variant="secondary" className="rounded-full">
                    {pilar.angle}
                  </Badge>
                </div>
              )}
            </div>
            <CardContent className="flex flex-col gap-2 p-4">
              <h3 className="text-lg font-semibold">{pilar.name}</h3>
              <p className="text-xs leading-relaxed text-muted-foreground">{pilar.description}</p>
              <ul className="flex flex-wrap gap-1.5" aria-label={`Fokus analisis ${pilar.name}`}>
                {pilar.tags.map((tag) => (
                  <li
                    key={tag}
                    className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground"
                  >
                    {tag}
                  </li>
                ))}
              </ul>
              <Link
                href="/sign-up"
                className="flex items-center gap-1 pt-2 text-xs font-bold text-primary hover:underline"
              >
                {pilar.cta} <ArrowRight className="size-3.5" />
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
