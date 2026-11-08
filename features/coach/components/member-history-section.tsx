import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { META_BADGE_VARIANT } from "@/components/shared/silat-reference";
import { HistoryPagination } from "@/features/coach/components/history-pagination";
import { HistorySessionCard } from "@/features/coach/components/history-session-card";
import type { CoachMemberHistoryPageViewModel } from "@/features/coach/types";

export function MemberHistorySection({
  history,
  hasCursor = false,
}: {
  history: CoachMemberHistoryPageViewModel;
  hasCursor?: boolean;
}) {
  return (
    <section aria-labelledby="member-history-heading" className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between gap-2">
        <h2 id="member-history-heading" className="text-lg font-bold">
          Daftar Riwayat Sesi
        </h2>
        <Badge variant={META_BADGE_VARIANT.count}>
          {history.items.length} Sesi
        </Badge>
      </div>
      <p className="text-xs text-muted-foreground">Catatan telemetri repetisi dan akurasi sensorik MediaPipe.</p>

      {history.items.length === 0 ? (
        <Card size="sm" className="opacity-70 bg-muted/20 border border-dashed border-border/80">
          <CardContent className="py-6 text-center text-xs text-muted-foreground">
            Belum ada riwayat sesi.
          </CardContent>
        </Card>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {history.items.map((session) => (
            <li key={session.id}>
              <HistorySessionCard session={session} />
            </li>
          ))}
        </ul>
      )}

      <HistoryPagination
        memberId={history.memberId}
        nextCursor={history.nextCursor}
        hasCursor={hasCursor}
      />
    </section>
  );
}
