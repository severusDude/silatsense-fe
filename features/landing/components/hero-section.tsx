import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { CameraHudCard } from "@/features/landing/components/camera-hud-card";

export function HeroSection() {
  return (
    <section id="beranda" aria-labelledby="hero-heading" className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 id="hero-heading" className="font-heading text-[32px] leading-10 font-bold tracking-tight uppercase">
          Kuasai gerakan dasar.
        </h1>
        <p className="font-heading text-[32px] leading-10 font-bold tracking-tight text-primary uppercase">
          Latih mandiri analisis presisi.
        </p>
      </div>
      <p className="text-[15px] leading-relaxed text-muted-foreground">
        Pelajari teknik dasar pencak silat UKM Universitas Siliwangi di mana saja melalui kamera
        HP atau laptop. Dapatkan verifikasi sudut persendian dan koreksi postur biomekanik instan.
      </p>
      <div className="flex flex-col gap-2.5 pt-1">
        <Link href="/sign-up" className={buttonVariants({ size: "lg", className: "w-full rounded-full" })}>
          Mulai Latihan <ArrowRight data-icon="inline-end" />
        </Link>
        <Link
          href="#cara-kerja"
          className={buttonVariants({ variant: "outline", size: "lg", className: "w-full rounded-full" })}
        >
          <Play data-icon="inline-start" /> Lihat Cara Kerja
        </Link>
      </div>
      <div className="pt-2">
        <CameraHudCard />
      </div>
    </section>
  );
}
