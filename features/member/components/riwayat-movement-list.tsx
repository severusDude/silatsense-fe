import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { RiwayatCardActions } from "@/features/member/components/riwayat-card-actions";
import { RiwayatCoachNote } from "@/features/member/components/riwayat-coach-note";
import { RiwayatFilterBar } from "@/features/member/components/riwayat-filter-bar";
import { RiwayatMovementItem } from "@/features/member/components/riwayat-movement-item";
import { RiwayatParamChips } from "@/features/member/components/riwayat-param-chips";
import type { HistoryPageViewModel } from "@/features/member/types";

export function RiwayatMovementList({ page }: { page: HistoryPageViewModel }) {
  const { items, filters, nextCursor } = page;

  return (
    <section aria-label="Daftar riwayat sesi" className="flex flex-col gap-3">
      <div className="flex flex-col gap-0.5 pt-2">
        <h2 className="text-base font-bold tracking-tight text-foreground">
          Daftar Riwayat Sesi
        </h2>
        <p className="text-[11px] text-muted-foreground">
          Klik baris sesi untuk melihat ringkasan evaluasi biomekanika instan
        </p>
      </div>

      <RiwayatFilterBar filters={filters} nextCursor={nextCursor}>
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed bg-muted/20 p-8 text-center">
            <p className="text-sm font-semibold text-foreground">
              Belum ada sesi latihan yang sesuai filter.
            </p>
            <p className="max-w-xs text-xs text-muted-foreground">
              Rekam sesi latihan baru atau reset filter untuk melihat seluruh riwayat.
            </p>
            <Link
              href="/latihan"
              className={buttonVariants({ size: "sm" })}
            >
              Mulai Latihan Baru
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {items.map((entry) => (
              <RiwayatMovementItem key={entry.id} entry={entry}>
                <RiwayatParamChips params={entry.params} />
                <RiwayatCoachNote note={entry.coachNote} />
                <RiwayatCardActions sessionId={entry.id} slug={entry.slug} />
              </RiwayatMovementItem>
            ))}
          </div>
        )}
      </RiwayatFilterBar>
    </section>
  );
}
