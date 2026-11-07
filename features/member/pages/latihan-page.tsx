import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { getTrainingCatalog } from "@/features/member/data/get-training-modules";
import { LatihanHero } from "@/features/member/components/latihan-hero";
import { ModuleCardList } from "@/features/member/components/module-card-list";

export function LatihanPage() {
  return (
    <div className="flex flex-col gap-5">
      <Suspense
        fallback={
          <div className="flex flex-col gap-5">
            <Skeleton className="h-36 w-full rounded-3xl" />
            <Skeleton className="h-96 w-full rounded-3xl" />
          </div>
        }
      >
        <CatalogSection />
      </Suspense>
    </div>
  );
}

async function CatalogSection() {
  const catalog = await getTrainingCatalog();
  if (!catalog) notFound();
  return (
    <>
      <LatihanHero hero={catalog.hero} />
      <ModuleCardList modules={catalog.modules} />
    </>
  );
}
