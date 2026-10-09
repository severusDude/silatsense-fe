import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { getCameras, getPersiapan } from "@/features/member/data/get-persiapan";
import { defaultCameraId } from "@/features/member/data/persiapan-dummy";
import { CameraExperience } from "@/features/member/components/camera-experience";
import { CoachInstructionCard } from "@/features/member/components/coach-instruction-card";
import { CalibrationCard } from "@/features/member/components/calibration-card";
import { PersiapanCta } from "@/features/member/components/persiapan-cta";

export function PersiapanPage({ slug }: { slug: string }) {
  return (
    <div className="flex flex-col gap-3.5">
      <Suspense fallback={<Skeleton className="aspect-video w-full rounded-2xl" />}>
        <CameraSection slug={slug} />
      </Suspense>
      <Suspense fallback={<Skeleton className="h-28 w-full rounded-2xl" />}>
        <CoachSection slug={slug} />
      </Suspense>
      <Suspense fallback={<Skeleton className="h-96 w-full rounded-2xl" />}>
        <CalibrationSection slug={slug} />
      </Suspense>
      <Suspense fallback={<Skeleton className="h-12 w-full rounded-full" />}>
        <CtaSection slug={slug} />
      </Suspense>
    </div>
  );
}

async function CameraSection({ slug }: { slug: string }) {
  const detail = await getPersiapan(slug);
  if (!detail) notFound();
  const cameras = await getCameras();
  return (
    <CameraExperience
      title={detail.title}
      cameras={cameras}
      defaultCameraId={defaultCameraId}
    />
  );
}

async function CoachSection({ slug }: { slug: string }) {
  const detail = await getPersiapan(slug);
  if (!detail) notFound();
  return <CoachInstructionCard quote={detail.coachQuote} />;
}

async function CalibrationSection({ slug }: { slug: string }) {
  const detail = await getPersiapan(slug);
  if (!detail) notFound();
  return <CalibrationCard detail={detail} />;
}

async function CtaSection({ slug }: { slug: string }) {
  const detail = await getPersiapan(slug);
  if (!detail) notFound();
  return <PersiapanCta />;
}
