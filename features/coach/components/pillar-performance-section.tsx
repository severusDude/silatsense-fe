import { ChevronRight, Footprints, Hand, PersonStanding, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { META_BADGE_VARIANT, performanceBadgeLabel, performanceBadgeVariant } from "@/components/shared/silat-reference";
import type { PilarPerformance } from "@/features/coach/types";

const pilarIcons = {
  "kuda-kuda": PersonStanding,
  pukulan: Hand,
  tangkisan: Shield,
  tendangan: Footprints,
} as const;

export function PilarPerformanceSection({ pilares }: { pilares: PilarPerformance[] }) {
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
        {pilares.map((pilar) => {
          const Icon = pilarIcons[pilar.slug];
          return (
            <Card key={pilar.slug} size="sm" className="gap-0">
              <CardHeader>
                <span className="flex size-7 items-center justify-center rounded-xl bg-muted">
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <Badge variant={performanceBadgeVariant(pilar.badgeKey)}>{performanceBadgeLabel(pilar.badgeKey)}</Badge>
              </CardHeader>
              <CardContent className="flex flex-col items-start gap-1">
                <p className="text-xs font-bold">{pilar.name}</p>
                <p className="text-lg font-bold tabular-nums">{pilar.scorePct}%</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
      {/* TODO: wire to full pillar breakdown when the backend lands */}
      <span aria-disabled="true" className={buttonVariants({ variant: "ghost", size: "sm", className: "w-full" })}>
        Lihat semua <ChevronRight data-icon="inline-end" />
      </span>
    </section>
  );
}
