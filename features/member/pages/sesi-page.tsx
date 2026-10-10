import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { getSesi } from "@/features/member/data/get-sesi";
import { SesiPlayback } from "@/features/member/components/sesi-playback";
import { SesiInfoCard } from "@/features/member/components/sesi-info-card";
import { SesiActions } from "@/features/member/components/sesi-actions";

export function SesiPage({ slug }: { slug: string }) {
  return (
    <div className="flex flex-col gap-3.5">
      <Suspense fallback={<Skeleton className="aspect-[3/4] w-full rounded-2xl" />}>
        <PlaybackSection slug={slug} />
      </Suspense>
      <Suspense fallback={<Skeleton className="h-48 w-full rounded-2xl" />}>
        <InfoSection slug={slug} />
      </Suspense>
      <Suspense fallback={<Skeleton className="h-12 w-full rounded-full" />}>
        <ActionsSection slug={slug} />
      </Suspense>
    </div>
  );
}

async function PlaybackSection({ slug }: { slug: string }) {
  const session = await getSesi(slug);
  if (!session) notFound();
  return <SesiPlayback session={session} />;
}

async function InfoSection({ slug }: { slug: string }) {
  const session = await getSesi(slug);
  if (!session) notFound();
  return <SesiInfoCard session={session} />;
}

async function ActionsSection({ slug }: { slug: string }) {
  const session = await getSesi(slug);
  if (!session) notFound();
  return <SesiActions slug={slug} />;
}
