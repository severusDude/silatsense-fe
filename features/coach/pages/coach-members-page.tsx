import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { getTeamMembers, getTeamMemberStats } from "@/features/coach/data/get-team-members";
import { MemberHeader } from "@/features/coach/components/member-header";
import { MemberStatGrid } from "@/features/coach/components/member-stat-grid";
import { MemberSearch } from "@/features/coach/components/member-search";

export function CoachMembersPage() {
  return (
    <div className="flex flex-col gap-5">
      <Suspense fallback={<Skeleton className="h-14 w-full rounded-3xl" />}>
        <HeaderSection />
      </Suspense>
      <Suspense fallback={<Skeleton className="h-44 w-full rounded-3xl" />}>
        <StatSection />
      </Suspense>
      <Suspense fallback={<Skeleton className="h-80 w-full rounded-3xl" />}>
        <ListSection />
      </Suspense>
    </div>
  );
}

async function HeaderSection() {
  const data = await getTeamMembers();
  return <MemberHeader totalAktif={data.totalAktif} />;
}

async function StatSection() {
  const stats = await getTeamMemberStats();
  return <MemberStatGrid stats={stats} />;
}

async function ListSection() {
  const data = await getTeamMembers();
  return <MemberSearch members={data.members} totalAktif={data.totalAktif} />;
}
