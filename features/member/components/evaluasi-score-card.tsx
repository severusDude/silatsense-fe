import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatScore, humanizeIdentifier } from "@/features/member/data/format";
import { formatPosturePoints } from "@/features/member/components/posture-assessment";
import type {
  EvaluationScoreViewModel,
  EvaluationViewModel,
} from "@/features/member/types";

const STATUS_VARIANTS: Record<
  EvaluationScoreViewModel["status"],
  "success" | "warning" | "destructive" | "outline"
> = {
  experimental: "warning",
  reference_compared: "outline",
  reference_not_ready: "outline",
  insufficient_pose: "destructive",
  insufficient_features: "destructive",
};

export function EvaluasiScoreCard({
  evaluation,
}: {
  evaluation: Pick<EvaluationViewModel, "score" | "coachComparison">;
}) {
  const { score } = evaluation;
  const assessment = evaluation.coachComparison?.postureAssessment;
  const similarity = score.available ? score.value : null;

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
        {assessment && (
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground">Poin postur eksperimental</p>
            {assessment.points === null ? (
              <p className="text-sm">Total belum dapat dinilai.</p>
            ) : (
              <p className="text-4xl font-bold tabular-nums">
                {formatPosturePoints(assessment.points)}
                <span className="text-xl text-muted-foreground">/{assessment.maxPoints ?? 100} poin</span>
              </p>
            )}
          </div>
        )}
        {(!assessment || similarity !== null) && (
          <>
            <p className="flex items-baseline gap-1">
              <span className="text-4xl font-bold">
                {similarity === null ? "—" : formatScore(similarity)}
              </span>
              <span className="text-xl font-bold text-muted-foreground">{score.unitLabel}</span>
            </p>
            <div
              role="img"
              aria-label={similarity === null
                ? "Skor kemiripan belum tersedia"
                : `Skor kemiripan ${formatScore(similarity)} dari ${score.max} poin`}
              className="flex h-2.5 w-full overflow-hidden rounded-full bg-secondary"
            >
              <div className="h-full rounded-full bg-warning" style={{ width: `${similarity ?? 0}%` }} />
            </div>
          </>
        )}

        {score.variantLabel ? (
          <p className="text-[11px] text-muted-foreground">
            Varian: {humanizeIdentifier(score.variantLabel)}
          </p>
        ) : null}

        <p className="rounded-xl bg-secondary/50 p-2.5 text-[11px] leading-relaxed">
          {assessment && similarity === null
            ? "Poin ini merangkum aspek postur yang dibandingkan dengan referensi Coach."
            : score.summary}
        </p>
      </CardContent>
    </Card>
  );
}
