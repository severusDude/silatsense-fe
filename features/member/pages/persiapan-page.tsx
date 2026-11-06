import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { getPersiapan } from "@/features/member/data/get-persiapan";
import { isTrainingModuleSlug } from "@/features/member/data/training-mapper";
import { CameraExperience } from "@/features/member/components/camera-experience";
import { MovementGuideCard } from "@/features/member/components/coach-instruction-card";
import { CalibrationCard } from "@/features/member/components/calibration-card";
import { PersiapanCta } from "@/features/member/components/persiapan-cta";

export function PersiapanPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <div className="flex flex-col gap-3.5">
      <Suspense
        fallback={
          <div className="flex flex-col gap-3.5">
            <Skeleton className="aspect-video w-full rounded-2xl" />
            <Skeleton className="h-28 w-full rounded-2xl" />
            <Skeleton className="h-96 w-full rounded-2xl" />
          </div>
        }
      >
        <PersiapanContent params={params} />
      </Suspense>
    </div>
  );
}

async function PersiapanContent({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!isTrainingModuleSlug(slug)) notFound();
  const detail = await getPersiapan(slug);
  if (!detail) notFound();

  const primaryGuide = detail.guides[0] ?? null;

  return (
    <>
      <CameraExperience title={detail.title} />
      {primaryGuide ? <MovementGuideCard guide={primaryGuide} /> : null}
      <CalibrationCard detail={detail} />
      <PersiapanCta slug={detail.slug} />
    </>
  );
}
