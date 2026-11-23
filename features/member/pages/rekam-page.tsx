import { initUpload, completeUpload } from "@/features/member/actions/direct-upload";
import { getEvaluation } from "@/features/member/data/get-evaluation";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { getRekam } from "@/features/member/data/get-rekam";
import { isTrainingModuleSlug } from "@/features/member/data/training-mapper";
import { RekamRecorder } from "@/features/member/components/rekam-recorder";
import { readRetryOf } from "@/features/member/recorder";

export function RekamPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <div className="flex flex-col gap-3.5">
      <Suspense
        fallback={
          <div className="flex flex-col gap-3.5">
            <Skeleton className="aspect-[3/4] w-full rounded-2xl" />
            <Skeleton className="h-12 w-full rounded-full" />
          </div>
        }
      >
        <RekamContent params={params} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function RekamContent({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  if (!isTrainingModuleSlug(slug)) notFound();

  const detail = await getRekam(slug);
  if (!detail) notFound();

  const retryOf = readRetryOf(query.retryOf);
  const previous = retryOf ? await getEvaluation(retryOf) : null;
  const requestedTarget = readRetryOf(query.movementId);
  const target = detail.movements?.find((item) => item.id === requestedTarget)?.id ?? (previous?.slug === slug ? previous.coachComparison?.movementId : undefined);
  const source = query.source === "file" ? "file" : "camera";
  return <RekamRecorder key={`${slug}:${retryOf ?? ""}:${target ?? ""}:${source}`} detail={detail} retryOf={retryOf} initialMovementId={target} initialSource={source} initAction={initUpload} completeAction={completeUpload} />;
}
