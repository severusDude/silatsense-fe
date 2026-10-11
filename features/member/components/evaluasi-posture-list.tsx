import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EvaluasiPostureItem } from "@/features/member/components/evaluasi-posture-item";
import type { EvaluationSession } from "@/features/member/types";

export function ScoreRing({ sesuai, total }: { sesuai: number; total: number }) {
  const pct = Math.round((sesuai / total) * 100);
  return (
    <div
      role="img"
      aria-label={`${sesuai} dari ${total} parameter sesuai`}
      className="grid size-11 shrink-0 place-items-center"
    >
      <svg viewBox="0 0 36 36" aria-hidden="true" className="col-start-1 row-start-1 size-11 -rotate-90">
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
  session,
}: {
  session: EvaluationSession;
}) {
  const ordered = [...session.postures].sort(
    (a, b) =>
      Number(b.status === "perlu-koreksi") - Number(a.status === "perlu-koreksi"),
  );
  const sesuai = session.postures.filter((p) => p.status === "sesuai").length;

  return (
    <section aria-label="Penilaian postur anatomis" className="flex flex-col gap-2">
      <Card>
        <CardHeader>
          <CardTitle>Penilaian Postur Anatomis</CardTitle>
          <CardDescription>Evaluasi 5 parameter biomekanika pukulan lurus</CardDescription>
          <CardAction>
            <ScoreRing sesuai={sesuai} total={session.postures.length} />
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {ordered.map((posture) => (
            <EvaluasiPostureItem key={posture.id} posture={posture} />
          ))}
        </CardContent>
      </Card>
    </section>
  );
}
