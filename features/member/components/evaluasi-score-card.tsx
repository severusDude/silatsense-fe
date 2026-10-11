import { TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { EvaluationSession } from "@/features/member/types";

export function EvaluasiScoreCard({
  session,
}: {
  session: EvaluationSession;
}) {
  const { score } = session;
  const widthPct = `${score.value}%`;
  const targetLeftPct = `${score.targetPct}%`;

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
              Akurasi Kinematika
            </p>
            <p className="flex items-baseline gap-1">
              <span className="text-4xl font-bold">{score.value}</span>
              <span className="text-xl font-bold text-muted-foreground">
                {score.unit}
              </span>
            </p>
          </div>
          <Badge variant="warning" className="uppercase">
            <TriangleAlert aria-hidden="true" /> {score.alertLabel}
          </Badge>
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] font-semibold text-muted-foreground">
              {score.targetLabel}
            </p>
            <p className="text-[10px] font-bold text-destructive">
              {score.deltaLabel}
            </p>
          </div>
          <div
            role="img"
            aria-label={`${score.value}% dari target ${score.targetPct}%`}
            className="flex h-2.5 w-full overflow-hidden rounded-full bg-secondary"
          >
            <div className="h-full rounded-full bg-warning" style={{ width: widthPct }} />
            <div
              aria-hidden="true"
              className="h-full w-0.5 shrink-0 bg-foreground"
              style={{ marginLeft: `calc(${targetLeftPct} - ${widthPct} - 1px)` }}
            />
          </div>
        </div>
        <p className="rounded-xl bg-secondary/50 p-2.5 text-[11px] leading-relaxed">
          {score.summary}
        </p>
      </CardContent>
    </Card>
  );
}
