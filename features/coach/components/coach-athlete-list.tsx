import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { stageBadgeVariant } from "@/features/coach/components/coach-stage";
import type { CoachAthlete } from "@/features/coach/types";

export function CoachAthleteList({ athletes }: { athletes: CoachAthlete[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Ringkasan Latihan Member</CardTitle>
        <CardAction>
          <Badge variant="secondary">5 Atlet</Badge>
        </CardAction>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col gap-2.5">
          {athletes.map((athlete) => (
            <li key={athlete.id} className="flex flex-col rounded-2xl border">
              <div className="flex items-center gap-2.5 p-2.5">
                <span
                  role="img"
                  aria-label={`Avatar ${athlete.name}`}
                  className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold text-secondary-foreground"
                >
                  {athlete.initials}
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <h3 className="truncate text-xs font-bold">{athlete.name}</h3>
                    <Badge variant={stageBadgeVariant(athlete.stage)}>{athlete.stageLabel}</Badge>
                  </div>
                  <p className="truncate text-[11px] text-muted-foreground">{athlete.lastGerakan}</p>
                </div>
                <span className="shrink-0 text-sm font-bold tabular-nums">{athlete.scorePct}%</span>
              </div>
              {/* TODO: wire to /coach/members/[id] when the Phase 11 detail move lands */}
              <Button
                variant="ghost"
                size="sm"
                aria-disabled="true"
                title={`Lihat detail ${athlete.name} (TODO)`}
                className="h-auto w-full justify-center gap-1 rounded-t-none border-t border-border px-2.5 py-2 text-xs font-bold text-primary hover:text-primary"
              >
                Lihat Detail <ChevronRight className="size-3.5" aria-hidden="true" />
              </Button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
