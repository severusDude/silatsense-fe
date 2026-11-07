"use client";

import type { ReactNode } from "react";
import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { RiwayatMovementSkeleton } from "@/features/member/components/riwayat-movement-skeleton";
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
  children,
}: {
  filters: HistoryFiltersViewModel;
  nextCursor: string | null;
  children?: ReactNode;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [pendingFilter, setPendingFilter] = useState<{
    type: "movement" | "review";
    value: string | null;
  } | null>(null);

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
    if (filters.movementSlug === slug) return;
    setPendingFilter({ type: "movement", value: slug });
    startTransition(() => {
      router.push(buildUrl({ movementSlug: slug, cursor: null }));
    });
  }

  function handleReviewStatusChange(status: "pending" | "needs_revision" | "approved" | null) {
    if (filters.reviewStatus === status) return;
    setPendingFilter({ type: "review", value: status });
    startTransition(() => {
      router.push(buildUrl({ reviewStatus: status, cursor: null }));
    });
  }

  function handleResetFilters() {
    setPendingFilter(null);
    startTransition(() => {
      router.push("/riwayat");
    });
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
          const isSelectedPending =
            isPending &&
            pendingFilter?.type === "movement" &&
            pendingFilter?.value === opt.value;

          return (
            <Button
              key={opt.label}
              type="button"
              variant={active ? "default" : "outline"}
              size="sm"
              disabled={isPending}
              onClick={() => handleMovementChange(opt.value)}
              className="flex items-center gap-1.5 rounded-full text-xs"
            >
              {isSelectedPending ? (
                <Loader2
                  aria-hidden="true"
                  className="size-3 animate-spin shrink-0"
                />
              ) : null}
              <span>{opt.label}</span>
            </Button>
          );
        })}
      </div>

      {/* Review Status Filter Chips & Reset */}
      <div className="flex flex-wrap items-center justify-between gap-1.5">
        <div className="flex flex-wrap gap-1.5" role="toolbar" aria-label="Filter status ulasan">
          {REVIEW_STATUS_OPTIONS.map((opt) => {
            const active = filters.reviewStatus === opt.value;
            const isSelectedPending =
              isPending &&
              pendingFilter?.type === "review" &&
              pendingFilter?.value === opt.value;

            return (
              <Button
                key={opt.label}
                type="button"
                variant={active ? "secondary" : "ghost"}
                size="sm"
                disabled={isPending}
                onClick={() => handleReviewStatusChange(opt.value)}
                className="flex h-7 items-center gap-1 rounded-lg px-2 text-[11px]"
              >
                {isSelectedPending ? (
                  <Loader2
                    aria-hidden="true"
                    className="size-3 animate-spin shrink-0"
                  />
                ) : null}
                <span>{opt.label}</span>
              </Button>
            );
          })}
        </div>

        {hasActiveFilters ? (
          <button
            type="button"
            disabled={isPending}
            onClick={handleResetFilters}
            className="text-[11px] font-medium text-muted-foreground hover:text-foreground disabled:opacity-50"
          >
            Reset Filter
          </button>
        ) : null}
      </div>

      {/* History Items or Skeleton Transition Fallback */}
      <div className="flex flex-col gap-3 pt-1">
        {isPending ? <RiwayatMovementSkeleton /> : children}
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
