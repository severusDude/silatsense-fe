import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { getRiwayat } from "@/features/member/data/get-riwayat";
import { RiwayatMovementList } from "@/features/member/components/riwayat-movement-list";
import { RiwayatStatGrid } from "@/features/member/components/riwayat-stat-grid";

export function RiwayatPage() {
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
      <Suspense fallback={<Skeleton className="h-96 w-full rounded-2xl" />}>
        <MovementsSection />
      </Suspense>
    </div>
  );
}

async function StatsSection() {
  const history = await getRiwayat();
  return <RiwayatStatGrid summary={history.summary} />;
}

async function MovementsSection() {
  const history = await getRiwayat();
  return <RiwayatMovementList entries={history.entries} />;
}
