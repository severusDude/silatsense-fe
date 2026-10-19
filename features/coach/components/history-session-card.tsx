import { Badge } from "@/components/ui/badge";
import { Card, CardFooter, CardHeader } from "@/components/ui/card";
import { performanceBadgeLabel, performanceBadgeVariant } from "@/components/shared/silat-reference";
import type { HistoryPageSession } from "@/features/coach/types";

type ToneVariant = ReturnType<typeof performanceBadgeVariant>;

const TONE_TEXT: Record<ToneVariant, string> = {
  success: "text-success-foreground",
  warning: "text-warning-foreground",
  destructive: "text-destructive",
  secondary: "text-muted-foreground",
};

const TONE_DOT: Record<ToneVariant, string> = {
  success: "bg-success-foreground",
  warning: "bg-warning-foreground",
  destructive: "bg-destructive",
  secondary: "bg-muted-foreground",
};

export function HistorySessionCard({ session }: { session: HistoryPageSession }) {
  const tone = performanceBadgeVariant(session.badgeKey);
  return (
    <Card size="sm">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-baseline gap-1">
            <span className="text-xs font-bold">{session.sesiLabel}</span>
            <span className="text-[10px] text-muted-foreground">• {session.dateLabel}</span>
          </div>
          <div className="flex shrink-0 flex-col items-end">
            <span className={`text-sm font-bold tabular-nums ${TONE_TEXT[tone]}`}>{session.scorePct.toFixed(1)}%</span>
            <span className="text-[9px] text-muted-foreground">Skor AI</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span aria-hidden className={`size-1.5 rounded-full ${TONE_DOT[tone]}`} />
          <p className="text-sm font-bold">{session.title}</p>
        </div>
        <p className="text-[10px] text-muted-foreground">{session.subtitle}</p>
      </CardHeader>
      <CardFooter className="justify-between gap-2">
        <p className="text-[10px] text-muted-foreground">{session.repetisiLabel}</p>
        <Badge variant={tone}>{performanceBadgeLabel(session.badgeKey)}</Badge>
      </CardFooter>
    </Card>
  );
}
