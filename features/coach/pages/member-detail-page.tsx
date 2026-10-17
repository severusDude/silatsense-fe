import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { getMemberDetail } from "@/features/coach/data/get-member-detail";
import { LatestEvaluationSection } from "@/features/coach/components/latest-evaluation";
import { MemberDetailProfile } from "@/features/coach/components/member-detail-profile";
import { MemberFeedbackCard } from "@/features/coach/components/member-feedback-card";
import { PilarPerformanceSection } from "@/features/coach/components/pillar-performance-section";
import { SessionHistoryLog } from "@/features/coach/components/session-history-log";

export function MemberDetailPage({ id }: { id: string }) {
  return (
    <div className="flex flex-col gap-5">
      <Suspense fallback={<Skeleton className="h-44 w-full rounded-3xl" />}>
        <ProfileSection id={id} />
      </Suspense>
      <Suspense fallback={<Skeleton className="h-64 w-full rounded-3xl" />}>
        <PilarSection id={id} />
      </Suspense>
      <Suspense fallback={<Skeleton className="h-96 w-full rounded-3xl" />}>
        <EvaluationSection id={id} />
      </Suspense>
      <Suspense fallback={<Skeleton className="h-56 w-full rounded-3xl" />}>
        <FeedbackSection id={id} />
      </Suspense>
      <Suspense fallback={<Skeleton className="h-64 w-full rounded-3xl" />}>
        <HistorySection id={id} />
      </Suspense>
    </div>
  );
}

async function ProfileSection({ id }: { id: string }) {
  const detail = await getMemberDetail(id);
  if (detail === null) notFound();
  return <MemberDetailProfile detail={detail} />;
}

async function PilarSection({ id }: { id: string }) {
  const detail = await getMemberDetail(id);
  if (detail === null) notFound();
  return <PilarPerformanceSection pilares={detail.pilares} />;
}

async function EvaluationSection({ id }: { id: string }) {
  const detail = await getMemberDetail(id);
  if (detail === null) notFound();
  return <LatestEvaluationSection evaluation={detail.evaluation} />;
}

async function FeedbackSection({ id }: { id: string }) {
  const detail = await getMemberDetail(id);
  if (detail === null) notFound();
  return <MemberFeedbackCard memberId={detail.id} memberName={detail.name} />;
}

async function HistorySection({ id }: { id: string }) {
  const detail = await getMemberDetail(id);
  if (detail === null) notFound();
  return <SessionHistoryLog history={detail.history} />;
}
