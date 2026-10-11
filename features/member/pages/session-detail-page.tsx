import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { getSessionDetail } from "@/features/member/data/get-session-detail";
import { SessionCoachCard } from "@/features/member/components/session-coach-card";
import { SessionKelayakanCard } from "@/features/member/components/session-kelayakan-card";
import { SessionVideoPlaceholder } from "@/features/member/components/session-video-placeholder";
import { SessionPostureList } from "@/features/member/components/session-posture-list";
import { SessionDetailActions } from "@/features/member/components/session-detail-actions";

export function SessionDetailPage({ id }: { id: string }) {
  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex flex-col gap-1.5 pt-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Evaluasi &amp; Arahan Pelatih
        </h1>
        <p className="text-xs leading-relaxed text-muted-foreground">
          Ulasan berkala, catatan teknis, dan verifikasi kelayakan jurus dari
          tim pelatih UKM Pencak Silat UNSIL berbasis data telemetri AI.
        </p>
      </div>
      <Suspense fallback={<Skeleton className="h-44 w-full rounded-2xl" />}>
        <CoachSection id={id} />
      </Suspense>
      <Suspense fallback={<Skeleton className="h-96 w-full rounded-2xl" />}>
        <KelayakanSection id={id} />
      </Suspense>
      <Suspense fallback={<Skeleton className="aspect-video w-full rounded-2xl" />}>
        <VisualSection id={id} />
      </Suspense>
      <Suspense fallback={<Skeleton className="h-96 w-full rounded-2xl" />}>
        <PostureSection id={id} />
      </Suspense>
      <Suspense fallback={<Skeleton className="h-24 w-full rounded-full" />}>
        <ActionsSection />
      </Suspense>
    </div>
  );
}

async function CoachSection({ id }: { id: string }) {
  const session = await getSessionDetail(id);
  if (!session) notFound();
  return <SessionCoachCard session={session} />;
}

async function KelayakanSection({ id }: { id: string }) {
  const session = await getSessionDetail(id);
  if (!session) notFound();
  return <SessionKelayakanCard session={session} />;
}

async function VisualSection({ id }: { id: string }) {
  const session = await getSessionDetail(id);
  if (!session) notFound();
  return <SessionVideoPlaceholder session={session} />;
}

async function PostureSection({ id }: { id: string }) {
  const session = await getSessionDetail(id);
  if (!session) notFound();
  return <SessionPostureList session={session} />;
}

function ActionsSection() {
  return <SessionDetailActions />;
}
