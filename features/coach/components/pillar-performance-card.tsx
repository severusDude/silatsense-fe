import { ChevronRight, Footprints, Hand, PersonStanding, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { META_BADGE_VARIANT, performanceBadgeLabel, performanceBadgeVariant } from "@/components/shared/silat-reference";
import type { PilarPerformance } from "@/features/coach/types";

const pilarIcons = {
  "kuda-kuda": PersonStanding,
  pukulan: Hand,
  tangkisan: Shield,
  tendangan: Footprints,
} as const;

export function PilarPerformanceCard({ pilares }: { pilares: PilarPerformance[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Performa 4 Pilar Dasar</CardTitle>
        <CardDescription>Penilaian per gerakan pokok pencak silat</CardDescription>
        <CardAction>
          <Badge variant={META_BADGE_VARIANT.count}>4 Pilar</Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-2.5">
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
      </CardContent>
      <CardFooter className="p-0">
        {/* TODO: wire to full pillar breakdown when the backend lands */}
        <span
          aria-disabled="true"
          className={buttonVariants({ variant: "ghost", size: "sm", className: "w-full" })}
        >
          Lihat semua <ChevronRight data-icon="inline-end" />
        </span>
      </CardFooter>
    </Card>
  );
}
