import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { getCameras } from "@/features/member/data/get-persiapan";
import { getRekam } from "@/features/member/data/get-rekam";
import { defaultCameraId } from "@/features/member/data/persiapan-dummy";
import { RekamViewport } from "@/features/member/components/rekam-viewport";
import { RekamSelesaiCta } from "@/features/member/components/rekam-selesai-cta";

export function RekamPage({ slug }: { slug: string }) {
  return (
    <div className="flex flex-col gap-3.5">
      <Suspense fallback={<Skeleton className="aspect-[3/4] w-full rounded-2xl" />}>
        <ViewportSection slug={slug} />
      </Suspense>
      <Suspense fallback={<Skeleton className="h-12 w-full rounded-full" />}>
        <CtaSection slug={slug} />
      </Suspense>
    </div>
  );
}

async function ViewportSection({ slug }: { slug: string }) {
  const detail = await getRekam(slug);
  if (!detail) notFound();
  const cameras = await getCameras();
  return (
    <RekamViewport
      label={detail.trainingName}
      cameras={cameras}
      defaultCameraId={defaultCameraId}
    />
  );
}

async function CtaSection({ slug }: { slug: string }) {
  const detail = await getRekam(slug);
  if (!detail) notFound();
  return <RekamSelesaiCta />;
}
