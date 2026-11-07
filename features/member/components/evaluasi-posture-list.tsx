import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EvaluasiPostureItem } from "@/features/member/components/evaluasi-posture-item";
import type {
  EvaluationViewModel,
  PostureStatusViewModel,
} from "@/features/member/types";

const STATUS_ORDER: Record<PostureStatusViewModel, number> = {
  "perlu-koreksi": 0,
  "tidak-dinilai": 1,
  sesuai: 2,
};

export function ScoreRing({ sesuai, total }: { sesuai: number; total: number }) {
  const pct = total > 0 ? Math.round((sesuai / total) * 100) : 0;
  return (
    <div
      role="img"
      aria-label={`${sesuai} dari ${total} parameter sesuai`}
      className="grid size-11 shrink-0 place-items-center"
    >
      <svg
        viewBox="0 0 36 36"
        aria-hidden="true"
        className="col-start-1 row-start-1 size-11 -rotate-90"
      >
        <circle
          cx="18"
          cy="18"
          r="15.9155"
          fill="none"
          strokeWidth="3.5"
          className="stroke-secondary"
        />
        <circle
          cx="18"
          cy="18"
          r="15.9155"
          fill="none"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray={`${pct} 100`}
          className="stroke-success-foreground"
        />
      </svg>
      <span
        aria-hidden="true"
        className="col-start-1 row-start-1 text-[10px] font-bold text-foreground"
      >
        {sesuai}/{total}
      </span>
    </div>
  );
}

export function EvaluasiPostureList({
  evaluation,
}: {
  evaluation: EvaluationViewModel;
}) {
  const { postures } = evaluation;
  const ordered = [...postures].sort(
    (a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status],
  );
  const sesuai = postures.filter((posture) => posture.status === "sesuai").length;

  return (
    <section
      aria-label="Penilaian postur anatomis"
      className="flex flex-col gap-2"
    >
      <Card>
        <CardHeader>
          <CardTitle>Penilaian Postur</CardTitle>
          <CardDescription>
            {postures.length > 0
              ? `${postures.length} parameter postur dinilai dari rekaman ini.`
              : "Belum ada parameter postur yang dinilai."}
          </CardDescription>
          {postures.length > 0 ? (
            <CardAction>
              <ScoreRing sesuai={sesuai} total={postures.length} />
            </CardAction>
          ) : null}
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {ordered.length > 0 ? (
            ordered.map((posture) => (
              <EvaluasiPostureItem key={posture.id} posture={posture} />
            ))
          ) : (
            <p className="rounded-xl bg-secondary/50 p-3 text-xs leading-relaxed text-muted-foreground">
              Analisis tidak menghasilkan pengukuran postur untuk rekaman ini.
            </p>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
