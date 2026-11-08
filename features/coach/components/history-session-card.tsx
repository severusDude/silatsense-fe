import { Badge } from "@/components/ui/badge";
import { Card, CardFooter, CardHeader } from "@/components/ui/card";
import { META_BADGE_VARIANT } from "@/components/shared/silat-reference";
import type { CoachMemberHistoryItem } from "@/features/coach/types";

export function HistorySessionCard({ session }: { session: CoachMemberHistoryItem }) {
  return (
    <Card size="sm">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-baseline gap-1.5">
            <Badge variant={META_BADGE_VARIANT.date}>{session.dateLabel}</Badge>
            {session.timeLabel ? (
              <span className="text-[10px] text-muted-foreground">• {session.timeLabel}</span>
            ) : null}
          </div>
          <div className="flex shrink-0 flex-col items-end">
            <span className="text-sm font-bold tabular-nums">{session.scoreLabel}</span>
            <span className="text-[9px] text-muted-foreground">Skor AI</span>
          </div>
        </div>
        <p className="text-sm font-bold">{session.title}</p>
        {session.subtitle ? (
          <p className="text-[10px] text-muted-foreground">{session.subtitle}</p>
        ) : null}
      </CardHeader>
      <CardFooter className="justify-end gap-2">
        <Badge variant={session.statusVariant}>{session.statusLabel}</Badge>
      </CardFooter>
    </Card>
  );
}
