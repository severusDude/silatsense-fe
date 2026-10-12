import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { getMemberDashboard } from "@/features/member/data/get-member-dashboard";
import { HeroGreeting } from "@/features/member/components/hero-greeting";
import { HeroVisualCard } from "@/features/member/components/hero-visual-card";
import { PillarGrid } from "@/features/member/components/pillar-grid";
import { SessionFeedback } from "@/features/member/components/session-feedback";
import { WeeklyProgress } from "@/features/member/components/weekly-progress";

export function DashboardPage() {
  return (
    <div className="flex flex-col gap-5">
      <Suspense fallback={<Skeleton className="h-64 w-full rounded-3xl" />}>
        <HeroSection />
      </Suspense>
      <Suspense fallback={<Skeleton className="h-72 w-full rounded-3xl" />}>
        <PillarSection />
      </Suspense>
      <Suspense fallback={<Skeleton className="h-80 w-full rounded-3xl" />}>
        <FeedbackSection />
      </Suspense>
      <Suspense fallback={<Skeleton className="h-64 w-full rounded-3xl" />}>
        <WeeklySection />
      </Suspense>
    </div>
  );
}

async function HeroSection() {
  const data = await getMemberDashboard();
  return (
    <div className="flex flex-col gap-4">
      <HeroGreeting greeting={data.greeting} />
      <HeroVisualCard metric={data.heroMetric} />
    </div>
  );
}

async function PillarSection() {
  const data = await getMemberDashboard();
  return <PillarGrid pillars={data.pillars} />;
}

async function FeedbackSection() {
  const data = await getMemberDashboard();
  return <SessionFeedback session={data.lastSession} />;
}

async function WeeklySection() {
  const data = await getMemberDashboard();
  return <WeeklyProgress weekly={data.weekly} note={data.coachNote} />;
}
