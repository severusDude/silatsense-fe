import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { getRiwayatPage, getRiwayatSummary } from "@/features/member/data/get-riwayat";
import { RiwayatMovementList } from "@/features/member/components/riwayat-movement-list";
import { RiwayatSectionSkeleton } from "@/features/member/components/riwayat-movement-skeleton";
import { RiwayatStatGrid } from "@/features/member/components/riwayat-stat-grid";
import { historyFilterQuerySchema } from "@/features/member/schemas/history";

export function RiwayatPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5 pt-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Riwayat Latihan
        </h1>
        <p className="text-xs leading-relaxed text-muted-foreground">
          Dokumentasi perkembangan kinematika dan ketepatan jurus pesilat secara
          berkala, dianalisis berbasis MediaPipe 33-point biomechanics.
        </p>
      </div>
      <Suspense fallback={<Skeleton className="h-44 w-full rounded-2xl" />}>
        <StatsSection />
      </Suspense>
      <Suspense fallback={<RiwayatSectionSkeleton />}>
        <MovementsSection searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function StatsSection() {
  const summary = await getRiwayatSummary();
  if (!summary) return null;
  return <RiwayatStatGrid summary={summary} />;
}

async function MovementsSection({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const rawParams = searchParams ? await searchParams : {};
  const normalizedParams = {
    movementSlug: typeof rawParams.movementSlug === "string" ? rawParams.movementSlug : null,
    reviewStatus: typeof rawParams.reviewStatus === "string" ? rawParams.reviewStatus : null,
    processingStatus: typeof rawParams.processingStatus === "string" ? rawParams.processingStatus : null,
    cursor: typeof rawParams.cursor === "string" ? rawParams.cursor : null,
    limit: typeof rawParams.limit === "string" ? rawParams.limit : undefined,
  };

  const filters = historyFilterQuerySchema.parse(normalizedParams);
  const page = await getRiwayatPage(filters);
  if (!page) return null;

  return <RiwayatMovementList page={page} />;
}
