import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { CoachPillar } from "@/features/coach/types";

export function CoachPillarMonitor({ pillars }: { pillars: CoachPillar[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Monitoring 4 Pilar Gerakan</CardTitle>
        <CardAction>
          <Badge variant="outline" className="opacity-60">
            Ambang target: Segera hadir
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col gap-3">
          {pillars.map((pillar) => (
            <li key={pillar.slug} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-bold">{pillar.name}</span>
                  <span className="text-[11px] text-muted-foreground">
                    {pillar.sampleLabel}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold tabular-nums">
                    {pillar.scoreLabel}
                  </span>
                  <Badge variant={pillar.statusVariant}>
                    {pillar.statusLabel}
                  </Badge>
                </div>
              </div>
              <div
                role="img"
                aria-label={`${pillar.name} ${pillar.scoreLabel}`}
                className="h-2 overflow-hidden rounded-full bg-muted"
              >
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${pillar.barPercent}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
