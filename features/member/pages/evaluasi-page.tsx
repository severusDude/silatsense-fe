import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { getEvaluation } from "@/features/member/data/get-evaluation";
import { isTrainingModuleSlug } from "@/features/member/data/training-mapper";
import { EvaluasiActions } from "@/features/member/components/evaluasi-actions";
import { EvaluasiHeader } from "@/features/member/components/evaluasi-header";
import { EvaluasiPlayback } from "@/features/member/components/evaluasi-playback";
import { EvaluasiPostureList } from "@/features/member/components/evaluasi-posture-list";
import { EvaluasiScoreCard } from "@/features/member/components/evaluasi-score-card";

export function EvaluasiPage({
  slug,
  sessionId,
}: {
  slug: string;
  sessionId: string;
}) {
  return (
    <div className="flex flex-col gap-3.5">
      <Suspense
        fallback={
          <div className="flex flex-col gap-3.5">
            <Skeleton className="h-24 w-full rounded-2xl" />
            <Skeleton className="aspect-[4/3] w-full rounded-2xl" />
            <Skeleton className="h-96 w-full rounded-2xl" />
            <Skeleton className="h-12 w-full rounded-full" />
          </div>
        }
      >
        <EvaluasiContent slug={slug} sessionId={sessionId} />
      </Suspense>
    </div>
  );
}

async function EvaluasiContent({
  slug,
  sessionId,
}: {
  slug: string;
  sessionId: string;
}) {
  if (!isTrainingModuleSlug(slug)) notFound();

  const evaluation = await getEvaluation(sessionId);
  if (!evaluation || evaluation.slug !== slug) notFound();

  return (
    <>
      <EvaluasiHeader evaluation={evaluation} />
      <EvaluasiScoreCard evaluation={evaluation} />
      <EvaluasiPlayback evaluation={evaluation} />
      <EvaluasiPostureList evaluation={evaluation} />
      <EvaluasiActions evaluation={evaluation} />
    </>
  );
}
