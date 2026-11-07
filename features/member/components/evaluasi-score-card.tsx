import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatScore, humanizeIdentifier } from "@/features/member/data/format";
import type {
  EvaluationScoreViewModel,
  EvaluationViewModel,
} from "@/features/member/types";

const STATUS_VARIANTS: Record<
  EvaluationScoreViewModel["status"],
  "success" | "warning" | "destructive" | "outline"
> = {
  experimental: "warning",
  reference_not_ready: "outline",
  insufficient_pose: "destructive",
  insufficient_features: "destructive",
};

export function EvaluasiScoreCard({
  evaluation,
}: {
  evaluation: EvaluationViewModel;
}) {
  const { score } = evaluation;
  const widthPct =
    score.available && score.value !== null ? `${score.value}%` : "0%";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
          Skor Kemiripan
        </CardTitle>
        <CardAction>
          <Badge variant={STATUS_VARIANTS[score.status]} className="uppercase">
            {score.statusLabel}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="flex items-baseline gap-1">
          <span className="text-4xl font-bold">
            {score.available && score.value !== null
              ? formatScore(score.value)
              : "—"}
          </span>
          <span className="text-xl font-bold text-muted-foreground">
            {score.unitLabel}
          </span>
        </p>

        <div
          role="img"
          aria-label={
            score.available && score.value !== null
              ? `Skor kemiripan ${formatScore(score.value)} dari ${score.max} poin`
              : "Skor kemiripan belum tersedia"
          }
          className="flex h-2.5 w-full overflow-hidden rounded-full bg-secondary"
        >
          <div
            className="h-full rounded-full bg-warning"
            style={{ width: widthPct }}
          />
        </div>

        {score.variantLabel ? (
          <p className="text-[11px] text-muted-foreground">
            Varian: {humanizeIdentifier(score.variantLabel)}
          </p>
        ) : null}

        <p className="rounded-xl bg-secondary/50 p-2.5 text-[11px] leading-relaxed">
          {score.summary}
        </p>
      </CardContent>
    </Card>
  );
}
