"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import type { HistoryFiltersViewModel, TrainingModuleSlug } from "@/features/member/types";

const MOVEMENT_OPTIONS: Array<{ label: string; value: TrainingModuleSlug | null }> = [
  { label: "Semua Gerakan", value: null },
  { label: "Kuda-kuda", value: "kuda-kuda" },
  { label: "Pukulan", value: "pukulan" },
  { label: "Tangkisan", value: "tangkisan" },
  { label: "Tendangan", value: "tendangan" },
];

const REVIEW_STATUS_OPTIONS: Array<{
  label: string;
  value: "pending" | "needs_revision" | "approved" | null;
}> = [
  { label: "Semua Status", value: null },
  { label: "Disetujui", value: "approved" },
  { label: "Perlu Revisi", value: "needs_revision" },
  { label: "Menunggu", value: "pending" },
];

export function RiwayatFilterBar({
  filters,
  nextCursor,
}: {
  filters: HistoryFiltersViewModel;
  nextCursor: string | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function buildUrl(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }
    const query = params.toString();
    return query ? `/riwayat?${query}` : "/riwayat";
  }

  function handleMovementChange(slug: TrainingModuleSlug | null) {
    router.push(buildUrl({ movementSlug: slug, cursor: null }));
  }

  function handleReviewStatusChange(status: "pending" | "needs_revision" | "approved" | null) {
    router.push(buildUrl({ reviewStatus: status, cursor: null }));
  }

  const hasActiveFilters =
    Boolean(filters.movementSlug) ||
    Boolean(filters.reviewStatus) ||
    Boolean(filters.processingStatus) ||
    Boolean(filters.cursor);

  return (
    <div className="flex flex-col gap-2.5">
      {/* Movement Filter Chips */}
      <div className="flex flex-wrap gap-1.5" role="toolbar" aria-label="Filter gerakan">
        {MOVEMENT_OPTIONS.map((opt) => {
          const active = filters.movementSlug === opt.value;
          return (
            <Button
              key={opt.label}
              type="button"
              variant={active ? "default" : "outline"}
              size="sm"
              onClick={() => handleMovementChange(opt.value)}
              className="rounded-full text-xs"
            >
              {opt.label}
            </Button>
          );
        })}
      </div>

      {/* Review Status Filter Chips & Reset */}
      <div className="flex flex-wrap items-center justify-between gap-1.5">
        <div className="flex flex-wrap gap-1.5" role="toolbar" aria-label="Filter status ulasan">
          {REVIEW_STATUS_OPTIONS.map((opt) => {
            const active = filters.reviewStatus === opt.value;
            return (
              <Button
                key={opt.label}
                type="button"
                variant={active ? "secondary" : "ghost"}
                size="sm"
                onClick={() => handleReviewStatusChange(opt.value)}
                className="h-7 rounded-lg px-2 text-[11px]"
              >
                {opt.label}
              </Button>
            );
          })}
        </div>

        {hasActiveFilters ? (
          <Link
            href="/riwayat"
            className="text-[11px] font-medium text-muted-foreground hover:text-foreground"
          >
            Reset Filter
          </Link>
        ) : null}
      </div>

      {/* Cursor Pagination Controls */}
      {nextCursor || filters.cursor ? (
        <div className="flex items-center justify-between gap-2 pt-1">
          {filters.cursor ? (
            <Link
              href={buildUrl({ cursor: null })}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              ← Halaman Pertama
            </Link>
          ) : <span />}

          {nextCursor ? (
            <Link
              href={buildUrl({ cursor: nextCursor })}
              className={buttonVariants({ variant: "default", size: "sm" })}
            >
              Halaman Berikutnya →
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
