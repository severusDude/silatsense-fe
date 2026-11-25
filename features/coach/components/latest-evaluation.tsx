import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getPose } from "@/features/member/data/get-pose";
import { PoseVideoPlayer } from "@/features/member/components/pose-video-player";
import { CoachComparisonDetails } from "@/features/member/components/coach-comparison";
import { formatPosturePoints, PostureAssessmentContent } from "@/features/member/components/posture-assessment";
import { PostureParamRow } from "@/features/coach/components/posture-param-row";
import type { CoachMemberEvaluationViewModel } from "@/features/coach/types";

export async function LatestEvaluationSection({
  evaluation,
}: {
  evaluation: CoachMemberEvaluationViewModel;
}) {
  const pose = evaluation.session?.mediaStatus === "available" ? await getPose(evaluation.session.id, "coach") : null;
  const comparison = evaluation.coachComparison;
  const assessment = comparison?.postureAssessment;
  if (!evaluation.available) {
    return (
      <section aria-labelledby="latest-evaluation-heading" className="flex flex-col gap-3">
        <div className="flex flex-col gap-0.5">
          <h2 id="latest-evaluation-heading" className="text-sm font-bold">
            Evaluasi Sesi Terkini
          </h2>
          <p className="text-[11px] text-muted-foreground">Belum ada sesi untuk dievaluasi.</p>
        </div>
        <Card size="sm" className="opacity-60 bg-muted/20 border border-dashed border-border/80">
          <CardContent className="flex flex-col items-center justify-center py-6 text-center">
            <p className="text-xs text-muted-foreground">Belum ada sesi evaluasi kinematika.</p>
            <Badge variant="outline" className="mt-2 border-dashed">
              Segera hadir
            </Badge>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section aria-labelledby="latest-evaluation-heading" className="flex flex-col gap-3">
      <div className="flex flex-col gap-0.5">
        <h2 id="latest-evaluation-heading" className="text-sm font-bold">
          {evaluation.techniqueName}
        </h2>
        <p className="text-[11px] text-muted-foreground">{evaluation.metaLabel}</p>
      </div>

      <Card>
        <CardContent className="flex items-end justify-between gap-3">
          <div className="flex flex-col gap-0.5">
            <p className="text-[11px] text-muted-foreground">
              {assessment ? "Poin postur eksperimental" : "Skor kinematika"}
            </p>
            <p className="text-2xl font-bold tabular-nums">
              {!assessment
                ? evaluation.score.label
                : assessment.points === null
                  ? "Belum dapat dinilai"
                  : `${formatPosturePoints(assessment.points)}/${assessment.maxPoints ?? 100} poin`}
            </p>
          </div>
          <div className="flex flex-col items-end gap-0.5">
            <p className="text-xs text-muted-foreground opacity-60">Target: Segera hadir</p>
            <p className="text-[11px] text-muted-foreground opacity-60">Selisih: Segera hadir</p>
          </div>
        </CardContent>
      </Card>

      {evaluation.analysisMetrics.length > 0 ? (
        <ul className="grid grid-cols-2 gap-2.5">
          {evaluation.analysisMetrics.map((metric) => (
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
      ) : null}

      {evaluation.session?.mediaStatus === "available" ? <PoseVideoPlayer src={`/api/coach/sessions/${evaluation.session.id}/video`} timeline={pose?.timeline} comparison={evaluation.coachComparison} poseError={pose?.error} /> : <p className="text-xs text-muted-foreground">Media tidak tersedia. Hasil dan review pelatih tetap tersimpan.</p>}

      {evaluation.measurements.length > 0 ? (
        <ul className="grid grid-cols-2 gap-2">
          {evaluation.measurements.map((stat) => (
            <li key={stat.id}>
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
      ) : null}

      {comparison || evaluation.aiPostures?.length ? <div className="flex flex-col gap-2">
        <h3 className="text-xs font-bold">Pengukuran Postur AI</h3>
        {assessment && <PostureAssessmentContent assessment={assessment} />}
        {evaluation.aiPostures?.length ? (
          <ul className="flex flex-col gap-2">{evaluation.aiPostures.map((posture) => <PostureParamRow key={posture.id} posture={posture} />)}</ul>
        ) : null}
        <CoachComparisonDetails comparison={comparison} />
      </div> : null}
      <div className="flex flex-col gap-1">
        <h3 className="text-xs font-bold">Penilaian Postur Anatomis oleh Pelatih</h3>
        {evaluation.postures.length === 0 ? (
          <p className="text-xs text-muted-foreground">Belum ada penilaian postur anatomis.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {evaluation.postures.map((posture) => (
              <PostureParamRow key={posture.id} posture={posture} />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
