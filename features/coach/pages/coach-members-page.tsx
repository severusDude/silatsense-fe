import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { getCoachMembersPage } from "@/features/coach/data/get-team-members";
import { MemberHeader } from "@/features/coach/components/member-header";
import { MemberStatGrid } from "@/features/coach/components/member-stat-grid";
import { MemberSearch } from "@/features/coach/components/member-search";
import { MemberCardList } from "@/features/coach/components/member-card-list";
import { coachMemberListQuerySchema } from "@/features/coach/schemas";

export function CoachMembersPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  return (
    <div className="flex flex-col gap-5">
      <Suspense fallback={<Skeleton className="h-14 w-full rounded-3xl" />}>
        <HeaderSection searchParams={searchParams} />
      </Suspense>
      <Suspense fallback={<Skeleton className="h-44 w-full rounded-3xl" />}>
        <StatSection searchParams={searchParams} />
      </Suspense>
      <Suspense fallback={<Skeleton className="h-80 w-full rounded-3xl" />}>
        <ListSection searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function resolveQuery(
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>,
) {
  const raw = searchParams ? await searchParams : {};
  return coachMemberListQuerySchema.parse(raw);
}

async function HeaderSection({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const query = await resolveQuery(searchParams);
  const data = await getCoachMembersPage(query);
  if (!data) return null;
  return <MemberHeader countLabel={data.countLabel} />;
}

async function StatSection({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const query = await resolveQuery(searchParams);
  const data = await getCoachMembersPage(query);
  if (!data) return null;
  return <MemberStatGrid stats={data.stats} />;
}

async function ListSection({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const query = await resolveQuery(searchParams);
  const data = await getCoachMembersPage(query);
  if (!data) return null;

  return (
    <div className="flex flex-col gap-2.5">
      <MemberSearch initialQuery={query.q} />
      <MemberCardList
        members={data.members}
        countLabel={data.countLabel}
        nextCursor={data.nextCursor}
        q={data.q}
      />
    </div>
  );
}
