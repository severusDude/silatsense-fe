import { CircleCheckBig, Target, Users, Video } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { CoachMemberStat } from "@/features/coach/types";

const statIcons = {
  "total-atlet": Users,
  "akurasi-tim": Target,
  "sidang-uji": CircleCheckBig,
  fokus: Video,
} as const;

export function MemberStatGrid({ stats }: { stats: CoachMemberStat[] }) {
  return (
    <section aria-label="Statistik binaan" className="grid grid-cols-2 gap-2.5">
      {stats.map((stat) => {
        const Icon = statIcons[stat.id] ?? Users;
        const isDimmed = !stat.valueAvailable;
        return (
          <Card
            key={stat.id}
            size="sm"
            className={cn(
              "gap-0",
              isDimmed && "opacity-60 bg-muted/20 border border-dashed border-border/80",
            )}
          >
            <CardHeader>
              <CardTitle className="text-xs">{stat.label}</CardTitle>
              <CardAction>
                <span className="flex size-7 items-center justify-center rounded-xl bg-muted">
                  <Icon className="size-4" aria-hidden="true" />
                </span>
              </CardAction>
            </CardHeader>
            <CardContent className="flex flex-col items-start gap-1.5">
              <p className={cn("text-lg font-bold tabular-nums", isDimmed && "text-muted-foreground")}>
                {stat.valueAvailable ? stat.value : "Segera hadir"}
              </p>
              {stat.badge ? (
                <Badge
                  variant={stat.badgeAvailable ? "secondary" : "outline"}
                  className={!stat.badgeAvailable ? "text-muted-foreground border-dashed" : undefined}
                >
                  {stat.badge}
                </Badge>
              ) : null}
              {stat.note ? (
                <p
                  className={cn(
                    "text-[11px]",
                    stat.noteAvailable ? "text-muted-foreground" : "text-muted-foreground/70",
                  )}
                >
                  {stat.note}
                </p>
              ) : null}
            </CardContent>
          </Card>
        );
      })}
    </section>
  );
}
