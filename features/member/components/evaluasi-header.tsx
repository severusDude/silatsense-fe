import { Badge } from "@/components/ui/badge";
import type { EvaluationSession } from "@/features/member/types";

export function EvaluasiHeader({ session }: { session: EvaluationSession }) {
  return (
    <section aria-label="Identitas sesi" className="flex flex-col gap-2">
      <h1 className="text-2xl font-bold tracking-tight">
        {session.techniqueName}
      </h1>
      <p className="text-[11px] text-muted-foreground">
        {session.evaluatedAtLabel}
      </p>
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge variant="success">{session.validReps} Repetisi Sah</Badge>
        <Badge variant="warning">{session.deviatedReps} Terdeviasi</Badge>
      </div>
    </section>
  );
}
