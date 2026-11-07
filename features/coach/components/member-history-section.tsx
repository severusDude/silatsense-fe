import { Badge } from "@/components/ui/badge";
import { META_BADGE_VARIANT } from "@/components/shared/silat-reference";
import { HistoryPagination } from "@/features/coach/components/history-pagination";
import { HistorySessionCard } from "@/features/coach/components/history-session-card";
import type { HistoryPageSlice } from "@/features/coach/data/paginate-history";
import type { MemberHistory } from "@/features/coach/types";

export function MemberHistorySection({ history, slice }: { history: MemberHistory; slice: HistoryPageSlice }) {
  return (
    <section aria-labelledby="member-history-heading" className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between gap-2">
        <h2 id="member-history-heading" className="text-lg font-bold">
          Daftar Riwayat Sesi
        </h2>
        <Badge variant={META_BADGE_VARIANT.count}>
          {slice.sessions.length} / {history.totalSessions} Sesi
        </Badge>
      </div>
      <p className="text-xs text-muted-foreground">Catatan telemetri repetisi dan akurasi sensorik MediaPipe.</p>
      <ul className="flex flex-col gap-2.5">
        {slice.sessions.map((session) => (
          <li key={session.id}>
            <HistorySessionCard session={session} />
          </li>
        ))}
      </ul>
      <HistoryPagination
        memberId={history.memberId}
        page={slice.page}
        totalPages={slice.totalPages}
        totalSessions={history.totalSessions}
        rangeStart={slice.rangeStart}
        rangeEnd={slice.rangeEnd}
      />
    </section>
  );
}
