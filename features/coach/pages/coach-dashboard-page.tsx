import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { getCoachDashboard } from "@/features/coach/data/get-coach-overview";
import { CoachHeader } from "@/features/coach/components/coach-header";
import { CoachStatGrid } from "@/features/coach/components/coach-stat-grid";
import { CoachAthleteList } from "@/features/coach/components/coach-athlete-list";
import { CoachPillarMonitor } from "@/features/coach/components/coach-pillar-monitor";
import { CoachPostureGrid } from "@/features/coach/components/coach-posture-grid";

export function CoachDashboardPage() {
  return (
    <div className="flex flex-col gap-5">
      <CoachHeader />
      <Suspense fallback={<Skeleton className="h-44 w-full rounded-3xl" />}>
        <StatSection />
      </Suspense>
      <Suspense fallback={<Skeleton className="h-80 w-full rounded-3xl" />}>
        <AthleteSection />
      </Suspense>
      <Suspense fallback={<Skeleton className="h-64 w-full rounded-3xl" />}>
        <PillarSection />
      </Suspense>
      <Suspense fallback={<Skeleton className="h-56 w-full rounded-3xl" />}>
        <PostureSection />
      </Suspense>
    </div>
  );
}

async function StatSection() {
  const data = await getCoachDashboard();
  if (!data) return null;
  return <CoachStatGrid stats={data.stats} />;
}

async function AthleteSection() {
  const data = await getCoachDashboard();
  if (!data) return null;
  return (
    <CoachAthleteList
      athletes={data.athletes}
      athleteCountLabel={data.athleteCountLabel}
    />
  );
}

async function PillarSection() {
  const data = await getCoachDashboard();
  if (!data) return null;
  return <CoachPillarMonitor pillars={data.pillars} />;
}

async function PostureSection() {
  const data = await getCoachDashboard();
  if (!data) return null;
  return <CoachPostureGrid posture={data.posture} />;
}
