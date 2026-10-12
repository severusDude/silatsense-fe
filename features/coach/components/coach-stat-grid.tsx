import { Clock, Target, Users, Wrench } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardAction, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { CoachStat } from "@/features/coach/types";

const statIcons = {
  "total-atlet": Users,
  "akurasi-tim": Target,
  antrean: Clock,
  fokus: Wrench,
} as const;

export function CoachStatGrid({ stats }: { stats: CoachStat[] }) {
  return (
    <section aria-label="Statistik tim" className="grid grid-cols-2 gap-2.5">
      {stats.map((stat) => {
        const Icon = statIcons[stat.id];
        return (
          <Card key={stat.id} size="sm" className="gap-0">
            <CardHeader>
              <CardTitle className="text-xs">{stat.label}</CardTitle>
              <CardAction>
                <span className="flex size-7 items-center justify-center rounded-xl bg-muted">
                  <Icon className="size-4" aria-hidden="true" />
                </span>
              </CardAction>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-bold tabular-nums">{stat.value}</p>
            </CardContent>
            <CardFooter className="flex-col items-start gap-1">
              <p className="text-[11px] text-muted-foreground">{stat.context}</p>
              {stat.badge ? (
                <Badge variant={stat.id === "akurasi-tim" ? "outline" : "secondary"}>{stat.badge}</Badge>
              ) : null}
            </CardFooter>
          </Card>
        );
      })}
    </section>
  );
}
