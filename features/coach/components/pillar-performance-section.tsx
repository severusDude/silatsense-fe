import { ChevronRight, Footprints, Hand, PersonStanding, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { META_BADGE_VARIANT } from "@/components/shared/silat-reference";
import type { CoachMemberPillarViewModel } from "@/features/coach/types";

const pilarIcons = {
  "kuda-kuda": PersonStanding,
  pukulan: Hand,
  tangkisan: Shield,
  tendangan: Footprints,
} as const;

export function PillarPerformanceSection({ pillars }: { pillars: CoachMemberPillarViewModel[] }) {
  return (
    <section aria-labelledby="pilar-performance-heading" className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h2 id="pilar-performance-heading" className="text-sm font-bold">
            Performa 4 Pilar Dasar
          </h2>
          <p className="text-xs text-muted-foreground">Penilaian per gerakan pokok pencak silat</p>
        </div>
        <Badge variant={META_BADGE_VARIANT.count}>4 Pilar</Badge>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {pillars.map((pilar) => {
          const Icon = pilarIcons[pilar.slug] ?? PersonStanding;
          return (
            <Card key={pilar.slug} size="sm" className="gap-0">
              <CardHeader>
                <span className="flex size-7 items-center justify-center rounded-xl bg-muted">
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <Badge variant={pilar.statusVariant}>{pilar.statusLabel}</Badge>
              </CardHeader>
              <CardContent className="flex flex-col items-start gap-1">
                <p className="text-xs font-bold">{pilar.name}</p>
                <p className="text-lg font-bold tabular-nums">{pilar.scoreLabel}</p>
                <p className="text-[11px] text-muted-foreground">{pilar.sampleLabel}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <span
        aria-disabled="true"
        className={buttonVariants({
          variant: "ghost",
          size: "sm",
          className: "w-full cursor-not-allowed opacity-60",
        })}
      >
        Lihat semua (Segera hadir) <ChevronRight data-icon="inline-end" />
      </span>
    </section>
  );
}

export { PillarPerformanceSection as PilarPerformanceSection };
