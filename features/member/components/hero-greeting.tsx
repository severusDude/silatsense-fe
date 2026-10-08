import { ArrowRight, BookOpen } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import type { GreetingData } from "@/features/member/types";

export function HeroGreeting({ greeting }: { greeting: GreetingData }) {
  return (
    <section aria-labelledby="dashboard-greeting" className="flex flex-col gap-2">
      <h1 id="dashboard-greeting" className="text-2xl font-bold tracking-tight">
        Halo, {greeting.name}.
      </h1>
      <p className="text-sm font-bold">Siap melatih presisi gerakan hari ini?</p>
      <p className="text-xs leading-relaxed text-muted-foreground">
        Sesi latihan mandiri terakhirmu {greeting.lastSessionDaysAgo} hari lalu. Fokus rekomendasi hari ini adalah
        mematangkan teknik <strong className="font-bold text-foreground">{greeting.focusTechnique}</strong> dan
        rotasi pinggul sebelum evaluasi mingguan.
      </p>
      <div className="flex flex-col gap-2 pt-1">
        {/* TODO: wire to /latihan session flow when the route lands */}
        <span aria-disabled="true" className={buttonVariants({ className: "w-full" })}>
          Mulai Sesi Latihan <ArrowRight data-icon="inline-end" />
        </span>
        {/* TODO: wire to /panduan biomekanik when the route lands */}
        <span aria-disabled="true" className={buttonVariants({ variant: "outline", className: "w-full" })}>
          <BookOpen data-icon="inline-start" /> Lihat Panduan Biomekanik
        </span>
      </div>
    </section>
  );
}
