import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { getTrainingModules } from "@/features/member/data/get-training-modules";
import { LatihanHero } from "@/features/member/components/latihan-hero";
import { ModuleCardList } from "@/features/member/components/module-card-list";

export function LatihanPage() {
  return (
    <div className="flex flex-col gap-5">
      <Suspense fallback={<Skeleton className="h-48 w-full rounded-3xl" />}>
        <HeroSection />
      </Suspense>
      <Suspense fallback={<Skeleton className="h-96 w-full rounded-3xl" />}>
        <ModulesSection />
      </Suspense>
    </div>
  );
}

async function HeroSection() {
  const data = await getTrainingModules();
  return <LatihanHero hero={data.hero} />;
}

async function ModulesSection() {
  const data = await getTrainingModules();
  return <ModuleCardList modules={data.modules} />;
}
