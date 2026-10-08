import Link from "next/link";
import { ArrowRight, Mail } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";

export function CtaBanner() {
  return (
    <section
      aria-labelledby="cta-heading"
      className="flex flex-col gap-4 overflow-hidden rounded-3xl bg-foreground p-5 text-background shadow-lg"
    >
      <div className="flex flex-col gap-2">
        <h2
          id="cta-heading"
          className="font-heading text-2xl leading-8 font-bold tracking-tight text-balance uppercase"
        >
          Siap tingkatkan ketepatan gerakan silat Anda?
        </h2>
        <p className="text-xs leading-relaxed text-background/60">
          Bergabunglah bersama keluarga besar UKM Pencak Silat Universitas Siliwangi. Latih
          disiplin pendekar tradisional dengan dukungan teknologi mutakhir.
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <Link
          href="/sign-up"
          className={buttonVariants({ size: "lg", className: "w-full rounded-full" })}
        >
          Mulai Latihan Mandiri Sekarang <ArrowRight data-icon="inline-end" />
        </Link>
        {/* TODO: wire to UKM contact channel (WhatsApp) once available */}
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="w-full rounded-full border-background/20 bg-transparent text-background hover:bg-background/10 hover:text-background"
        >
          <Mail data-icon="inline-start" /> Hubungi Pengurus UKM
        </Button>
      </div>
    </section>
  );
}
