import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { META_BADGE_VARIANT } from "@/components/shared/silat-reference";
import type { CoachMemberHistoryItem } from "@/features/coach/types";

export function SessionHistoryLog({
  history,
  memberId,
}: {
  history: CoachMemberHistoryItem[];
  memberId: string;
}) {
  return (
    <section aria-labelledby="session-history-heading" className="flex flex-col gap-2.5">
      <h2 id="session-history-heading" className="text-sm font-bold">
        Riwayat Sesi Terkini
      </h2>

      {history.length === 0 ? (
        <Card size="sm" className="opacity-70 bg-muted/20 border border-dashed border-border/80">
          <CardContent className="py-6 text-center text-xs text-muted-foreground">
            Belum ada riwayat sesi.
          </CardContent>
        </Card>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {history.map((session) => (
            <li key={session.id}>
              <Card size="sm">
                <CardHeader>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge variant={META_BADGE_VARIANT.date}>{session.dateLabel}</Badge>
                    {session.timeLabel ? (
                      <span className="text-[10px] text-muted-foreground">{session.timeLabel}</span>
                    ) : null}
                  </div>
                  <p className="text-xs font-bold">{session.title}</p>
                  {session.subtitle ? (
                    <p className="text-[11px] text-muted-foreground">{session.subtitle}</p>
                  ) : null}
                </CardHeader>
                <CardContent className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold tabular-nums">{session.scoreLabel}</span>
                  <Badge variant={session.statusVariant}>{session.statusLabel}</Badge>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <Link
        href={`/coach/members/${memberId}/riwayat`}
        className={buttonVariants({ variant: "ghost", size: "sm", className: "w-full" })}
      >
        Buku Semua Riwayat Atlet <ChevronRight data-icon="inline-end" />
      </Link>
    </section>
  );
}
