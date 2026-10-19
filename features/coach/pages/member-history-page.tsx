import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { getMemberDetail } from "@/features/coach/data/get-member-detail";
import { getMemberHistory } from "@/features/coach/data/get-member-history";
import { paginateHistory, parseHistoryPage } from "@/features/coach/data/paginate-history";
import { MemberDetailProfile } from "@/features/coach/components/member-detail-profile";
import { MemberHistorySection } from "@/features/coach/components/member-history-section";

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
  const detail = await getMemberDetail(id);
  if (detail === null) notFound();
  return <MemberDetailProfile detail={detail} />;
}

async function HistorySection({
  id,
  searchParams,
}: {
  id: string;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [history, query] = await Promise.all([getMemberHistory(id), searchParams]);
  if (history === null) notFound();
  const page = parseHistoryPage(query.page);
  const slice = paginateHistory(history.sessions, page, history.pageSize);
  return <MemberHistorySection history={history} slice={slice} />;
}
