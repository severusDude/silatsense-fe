import { ChevronRight, Footprints, Hand, Shield, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { pillarBadgeVariant } from "@/features/member/components/pillar-status";
import type { PillarStat } from "@/features/member/types";

const pillarIcons = {
  "kuda-kuda": Footprints,
  pukulan: Hand,
  tangkisan: Shield,
  tendangan: Zap,
} as const;

export function PillarGrid({ pillars }: { pillars: PillarStat[] }) {
  return (
    <section aria-labelledby="pillar-heading" className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col">
          <h2 id="pillar-heading" className="text-sm font-bold tracking-tight">
            Kategori Gerakan Dasar
          </h2>
          <p className="text-xs text-muted-foreground">4 pilar kurikulum baku pesilat pemula UNSIL</p>
        </div>
        <Badge variant="secondary">Gasal 2024</Badge>
      </div>
      <ul className="grid grid-cols-2 gap-2.5">
        {pillars.map((pillar) => {
          const Icon = pillarIcons[pillar.slug];
          return (
            <li key={pillar.slug} className="flex">
              <Card
                size="sm"
                className={`flex-1 gap-0 ${pillar.active ? "border-2 border-primary" : ""}`}
              >
                <CardContent className="flex flex-1 flex-col gap-2 p-3">
                  <div className="flex items-center justify-between">
                    <span className="flex size-7 items-center justify-center rounded-xl bg-muted">
                      <Icon className="size-4" />
                    </span>
                    <Badge variant={pillarBadgeVariant(pillar.status)}>{pillar.statusLabel}</Badge>
                  </div>
                  <div className="flex flex-col">
                    <h3 className="text-xs font-bold">{pillar.name}</h3>
                    <p className={`text-[11px] ${pillar.active ? "text-primary" : "text-muted-foreground"}`}>
                      {pillar.detail}
                    </p>
                  </div>
                  <div className="mt-auto flex items-end justify-between border-t pt-2">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[8px] font-bold tracking-widest text-muted-foreground uppercase">
                        Rata-rata
                      </span>
                      <span className={`text-sm font-bold ${pillar.active ? "text-primary" : ""}`}>
                        {pillar.avgPct.toFixed(1)}%
                      </span>
                    </div>
                    {pillar.active ? (
                      /* TODO: wire to /latihan pukulan flow when the route lands */
                      <span aria-disabled="true" className="flex items-center gap-0.5 text-xs font-bold text-primary">
                        Lanjut <ChevronRight className="size-3.5" />
                      </span>
                    ) : (
                      <ChevronRight className="size-4 text-muted-foreground" aria-hidden="true" />
                    )}
                  </div>
                </CardContent>
              </Card>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
