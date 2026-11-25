import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScoreRing } from "@/features/member/components/evaluasi-posture-list";
import { SessionPostureItem } from "@/features/member/components/session-posture-item";
import { CoachComparisonDetails } from "@/features/member/components/coach-comparison";
import { formatPosturePoints, PostureAssessmentContent } from "@/features/member/components/posture-assessment";
import type { SessionDetailViewModel } from "@/features/member/types";

export function SessionPostureList({
  session,
}: {
  session: SessionDetailViewModel;
}) {
  const postures = session.coachBodyAssessments;
  const comparison = session.evaluation?.coachComparison;
  const assessment = comparison?.postureAssessment;

  const empty = postures.length === 0;
  const sesuai = postures.filter((p) => p.status === "sesuai").length;
  const total = empty ? 5 : postures.length;

  return (
    <section aria-label="Catatan pelatih" className="flex flex-col gap-2">
      {comparison && (
        <Card>
          <CardHeader>
            <CardTitle>Penilaian Postur</CardTitle>
            {assessment?.points != null && (
              <CardDescription>
                Poin postur eksperimental · {formatPosturePoints(assessment.points)}/{assessment.maxPoints ?? 100} poin
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {assessment && <PostureAssessmentContent assessment={assessment} />}
            <CoachComparisonDetails comparison={comparison} />
          </CardContent>
        </Card>
      )}
      <Card>
        <CardHeader>
          <CardTitle>Catatan Pelatih</CardTitle>
          <CardDescription>Evaluasi biomekanika kinetik oleh pelatih</CardDescription>
          <CardAction>
            <ScoreRing sesuai={sesuai} total={total} />
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {empty ? (
            <p className="rounded-xl border bg-secondary/30 p-3 text-xs font-semibold text-foreground">
              Belum ada catatan dari pelatih
            </p>
          ) : (
            postures.map((posture) => (
              <SessionPostureItem key={posture.id} posture={posture} />
            ))
          )}
        </CardContent>
      </Card>
    </section>
  );
}
