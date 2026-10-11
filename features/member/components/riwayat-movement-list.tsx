import type { HistoryEntry } from "@/features/member/types";
import { RiwayatCardActions } from "@/features/member/components/riwayat-card-actions";
import { RiwayatCoachNote } from "@/features/member/components/riwayat-coach-note";
import { RiwayatMovementItem } from "@/features/member/components/riwayat-movement-item";
import { RiwayatParamChips } from "@/features/member/components/riwayat-param-chips";

export function RiwayatMovementList({ entries }: { entries: HistoryEntry[] }) {
  return (
    <section aria-label="Daftar gerakan utama" className="flex flex-col gap-2">
      <div className="flex flex-col gap-0.5 pt-2">
        <h2 className="text-base font-bold tracking-tight text-foreground">
          Daftar 4 Gerakan Utama
        </h2>
        <p className="text-[11px] text-muted-foreground">
          Klik baris gerakan untuk melihat ringkasan evaluasi biomekanika instan
        </p>
      </div>
      <div className="flex flex-col gap-3">
        {entries.map((entry) => (
          <RiwayatMovementItem key={entry.slug} entry={entry}>
            <RiwayatParamChips params={entry.params} />
            <RiwayatCoachNote note={entry.coachNote} />
            <RiwayatCardActions slug={entry.slug} />
          </RiwayatMovementItem>
        ))}
      </div>
    </section>
  );
}
