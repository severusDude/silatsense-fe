import { Skeleton } from "@/components/ui/skeleton";

export function RiwayatMovementSkeleton() {
  return (
    <div
      data-testid="riwayat-movement-skeleton"
      aria-label="Memuat riwayat sesi"
      aria-busy="true"
      className="flex flex-col gap-3"
    >
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="flex w-full items-start gap-3 rounded-2xl border bg-card p-3.5"
        >
          <Skeleton className="size-9 shrink-0 rounded-xl" />
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <Skeleton className="h-4 w-28 rounded-md" />
            <Skeleton className="h-3 w-36 rounded-md" />
            <Skeleton className="h-3 w-24 rounded-md" />
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-4 w-12 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function RiwayatSectionSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1 pt-2">
        <Skeleton className="h-5 w-40 rounded-md" />
        <Skeleton className="h-3 w-64 rounded-md" />
      </div>
      <div className="flex flex-wrap gap-1.5 py-1">
        <Skeleton className="h-8 w-28 rounded-full" />
        <Skeleton className="h-8 w-24 rounded-full" />
        <Skeleton className="h-8 w-20 rounded-full" />
        <Skeleton className="h-8 w-24 rounded-full" />
        <Skeleton className="h-8 w-24 rounded-full" />
      </div>
      <div className="flex flex-wrap gap-1.5 pb-1">
        <Skeleton className="h-7 w-24 rounded-lg" />
        <Skeleton className="h-7 w-20 rounded-lg" />
        <Skeleton className="h-7 w-24 rounded-lg" />
        <Skeleton className="h-7 w-20 rounded-lg" />
      </div>
      <RiwayatMovementSkeleton />
    </div>
  );
}
