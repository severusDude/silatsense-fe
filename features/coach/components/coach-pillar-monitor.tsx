import { Badge } from "@/components/ui/badge";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CoachPillar } from "@/features/coach/types";

function pillarBadgeVariant(status: CoachPillar["status"]): "success" | "secondary" | "warning" {
  if (status === "stabil") return "success";
  if (status === "optimal") return "secondary";
  return "warning";
}

export function CoachPillarMonitor({ pillars }: { pillars: CoachPillar[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Monitoring 4 Pilar Gerakan</CardTitle>
        <CardAction>
          <Badge variant="outline">Target ≥ 85%</Badge>
        </CardAction>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col gap-3">
          {pillars.map((pillar) => (
            <li key={pillar.slug} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold">{pillar.name}</span>
                <span className="flex items-center gap-1.5">
                  <span className="text-xs font-bold tabular-nums">{pillar.avgPct.toFixed(1)}%</span>
                  <Badge variant={pillarBadgeVariant(pillar.status)}>{pillar.statusLabel}</Badge>
                </span>
              </div>
              <div role="img" aria-label={`${pillar.name} ${pillar.avgPct.toFixed(1)} persen`} className="h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary" style={{ width: `${pillar.avgPct}%` }} />
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
