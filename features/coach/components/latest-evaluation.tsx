import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ImagePlaceholder } from "@/components/shared/image-placeholder";
import { META_BADGE_VARIANT } from "@/components/shared/silat-reference";
import { PostureParamRow } from "@/features/coach/components/posture-param-row";
import type { LatestEvaluation } from "@/features/coach/types";

export function LatestEvaluationSection({ evaluation }: { evaluation: LatestEvaluation }) {
  return (
    <section aria-labelledby="latest-evaluation-heading" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge variant={META_BADGE_VARIANT.sesi}>Sesi 24</Badge>
        <Badge variant={META_BADGE_VARIANT.standar}>Standar IPSI</Badge>
      </div>
      <div className="flex flex-col gap-0.5">
        <h2 id="latest-evaluation-heading" className="text-sm font-bold">
          {evaluation.technique}
        </h2>
        <p className="text-[11px] text-muted-foreground">{evaluation.metaLabel}</p>
      </div>
      <div className="flex items-end justify-between gap-3 rounded-2xl border p-3">
        <div className="flex flex-col gap-0.5">
          <p className="text-[11px] text-muted-foreground">Skor kinematika</p>
          <p className="text-2xl font-bold tabular-nums">{evaluation.bigScorePct}%</p>
        </div>
        <div className="flex flex-col items-end gap-0.5">
          <p className="text-xs tabular-nums">Target {evaluation.targetValue}</p>
          <p className="text-[11px] text-muted-foreground tabular-nums">Selisih {evaluation.deltaValue}</p>
        </div>
      </div>
      <ul className="grid grid-cols-2 gap-2.5">
        {evaluation.metrics.map((metric) => (
          <li key={metric.label}>
            <Card size="sm">
              <CardContent className="flex flex-col gap-0.5">
                <p className="text-[11px] text-muted-foreground">{metric.label}</p>
                <p className="text-sm font-bold tabular-nums">{metric.value}</p>
                <p className="text-[11px] text-muted-foreground">{metric.sub}</p>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
      <ImagePlaceholder label="Visual tracking Pukulan Lurus Depan" />
      <ul className="grid grid-cols-2 gap-2">
        {evaluation.quickStats.map((stat) => (
          <li key={stat.label}>
            <Card size="sm">
              <CardContent className="flex flex-col items-center gap-0.5 text-center">
                <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                <p className="text-xs font-bold tabular-nums">{stat.value}</p>
                <p className="text-[10px] text-muted-foreground">{stat.sub}</p>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
      <div className="flex flex-col gap-1">
        <h3 className="text-xs font-bold">Penilaian Postur Anatomis</h3>
        <ul className="flex flex-col gap-2">
          {evaluation.postures.map((param) => (
            <PostureParamRow key={param.id} param={param} />
          ))}
        </ul>
      </div>
    </section>
  );
}
