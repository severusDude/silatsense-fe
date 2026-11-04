import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { getRekam } from "@/features/member/data/get-rekam";
import { isTrainingModuleSlug } from "@/features/member/data/training-mapper";
import { RekamViewport } from "@/features/member/components/rekam-viewport";
import { RekamSelesaiCta } from "@/features/member/components/rekam-selesai-cta";

export function RekamPage({ slug }: { slug: string }) {
  return (
    <div className="flex flex-col gap-3.5">
      <Suspense
        fallback={
          <div className="flex flex-col gap-3.5">
            <Skeleton className="aspect-[3/4] w-full rounded-2xl" />
            <Skeleton className="h-12 w-full rounded-full" />
          </div>
        }
      >
        <RekamContent slug={slug} />
      </Suspense>
    </div>
  );
}

async function RekamContent({ slug }: { slug: string }) {
  if (!isTrainingModuleSlug(slug)) notFound();
  const detail = await getRekam(slug);
  if (!detail) notFound();

  return (
    <>
      <RekamViewport detail={detail} />
      <RekamSelesaiCta slug={detail.slug} />
    </>
  );
}
