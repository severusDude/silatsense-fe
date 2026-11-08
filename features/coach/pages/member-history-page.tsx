import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { getCoachMemberDetail } from "@/features/coach/data/get-member-detail";
import { getCoachMemberHistory } from "@/features/coach/data/get-member-history";
import { MemberDetailProfile } from "@/features/coach/components/member-detail-profile";
import { MemberHistorySection } from "@/features/coach/components/member-history-section";
import { coachMemberHistoryQuerySchema } from "@/features/coach/schemas";

export function MemberHistoryPage({
  id,
  searchParams,
}: {
  id: string;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <div className="flex flex-col gap-5">
      <Suspense fallback={<Skeleton className="h-44 w-full rounded-3xl" />}>
        <ProfileSection id={id} />
      </Suspense>
      <Suspense fallback={<Skeleton className="h-96 w-full rounded-3xl" />}>
        <HistorySection id={id} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function ProfileSection({ id }: { id: string }) {
  const detail = await getCoachMemberDetail(id);
  if (detail === null) notFound();
  return <MemberDetailProfile profile={detail.profile} />;
}

async function HistorySection({
  id,
  searchParams,
}: {
  id: string;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const query = coachMemberHistoryQuerySchema.parse(raw);
  const history = await getCoachMemberHistory(id, query);
  if (history === null) notFound();

  return (
    <MemberHistorySection
      history={history}
      hasCursor={Boolean(query.cursor)}
    />
  );
}
