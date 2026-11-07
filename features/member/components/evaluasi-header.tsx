import { Gauge, Repeat2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { EvaluationViewModel } from "@/features/member/types";

export function EvaluasiHeader({
  evaluation,
}: {
  evaluation: EvaluationViewModel;
}) {
  return (
    <section aria-label="Identitas sesi" className="flex flex-col gap-2">
      <h1 className="text-2xl font-bold tracking-tight">
        {evaluation.techniqueName}
      </h1>
      <p className="text-[11px] text-muted-foreground">
        {evaluation.evaluatedAtLabel}
      </p>
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge variant="outline">
          <Gauge aria-hidden="true" /> {evaluation.postureQualityLabel}
        </Badge>
        <Badge variant="secondary" aria-label="Penghitungan repetisi belum tersedia">
          <Repeat2 aria-hidden="true" /> Repetisi segera hadir
        </Badge>
      </div>
    </section>
  );
}
