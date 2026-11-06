import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { getSession } from "@/features/member/data/get-session";
import { isTrainingModuleSlug } from "@/features/member/data/training-mapper";
import { SessionActions } from "@/features/member/components/session-actions";
import { SesiInfoCard } from "@/features/member/components/sesi-info-card";
import { SesiPlayback } from "@/features/member/components/sesi-playback";
import { SessionStatusPoller } from "@/features/member/components/session-status-poller";

export function SesiPage({
  params,
}: {
  params: Promise<{ slug: string; sessionId: string }>;
}) {
  return (
    <div className="flex flex-col gap-3.5">
      <Suspense
        fallback={
          <div className="flex flex-col gap-3.5">
            <Skeleton className="aspect-[3/4] w-full rounded-2xl" />
            <Skeleton className="h-72 w-full rounded-2xl" />
            <Skeleton className="h-12 w-full rounded-full" />
          </div>
        }
      >
        <SesiContent params={params} />
      </Suspense>
    </div>
  );
}

async function SesiContent({
  params,
}: {
  params: Promise<{ slug: string; sessionId: string }>;
}) {
  const { slug, sessionId } = await params;
  if (!isTrainingModuleSlug(slug)) notFound();

  const session = await getSession(sessionId);
  if (!session || session.slug !== slug) notFound();

  const processing =
    session.processingStatus === "queued" ||
    session.processingStatus === "processing";

  return (
    <>
      <SessionStatusPoller active={processing} />
      <SesiPlayback session={session} />
      <SesiInfoCard session={session} />
      <SessionActions session={session} />
    </>
  );
}
