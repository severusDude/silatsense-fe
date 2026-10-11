import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { getEvaluasi } from "@/features/member/data/get-evaluasi";
import { EvaluasiHeader } from "@/features/member/components/evaluasi-header";
import { EvaluasiScoreCard } from "@/features/member/components/evaluasi-score-card";
import { EvaluasiPlayback } from "@/features/member/components/evaluasi-playback";
import { EvaluasiPostureList } from "@/features/member/components/evaluasi-posture-list";
import { EvaluasiActions } from "@/features/member/components/evaluasi-actions";

export function EvaluasiPage({ slug }: { slug: string }) {
  return (
    <div className="flex flex-col gap-3.5">
      <Suspense fallback={<Skeleton className="h-24 w-full rounded-2xl" />}>
        <HeaderSection slug={slug} />
      </Suspense>
      <Suspense fallback={<Skeleton className="aspect-[4/3] w-full rounded-2xl" />}>
        <VisualSection slug={slug} />
      </Suspense>
      <Suspense fallback={<Skeleton className="h-96 w-full rounded-2xl" />}>
        <PostureSection slug={slug} />
      </Suspense>
      <Suspense fallback={<Skeleton className="h-12 w-full rounded-full" />}>
        <ActionsSection slug={slug} />
      </Suspense>
    </div>
  );
}

async function HeaderSection({ slug }: { slug: string }) {
  const session = await getEvaluasi(slug);
  if (!session) notFound();
  return (
    <>
      <EvaluasiHeader session={session} />
      <EvaluasiScoreCard session={session} />
    </>
  );
}

async function VisualSection({ slug }: { slug: string }) {
  const session = await getEvaluasi(slug);
  if (!session) notFound();
  return (
    <>
      <EvaluasiPlayback session={session} />
    </>
  );
}

async function PostureSection({ slug }: { slug: string }) {
  const session = await getEvaluasi(slug);
  if (!session) notFound();
  return <EvaluasiPostureList session={session} />;
}

async function ActionsSection({ slug }: { slug: string }) {
  const session = await getEvaluasi(slug);
  if (!session) notFound();
  return <EvaluasiActions session={session} />;
}
