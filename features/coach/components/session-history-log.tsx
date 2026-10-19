import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { META_BADGE_VARIANT, performanceBadgeLabel, performanceBadgeVariant } from "@/components/shared/silat-reference";
import type { HistorySession } from "@/features/coach/types";

export function SessionHistoryLog({ history, memberId }: { history: HistorySession[]; memberId: string }) {
  return (
    <section aria-labelledby="session-history-heading" className="flex flex-col gap-2.5">
      <h2 id="session-history-heading" className="text-sm font-bold">
        Riwayat Sesi Terkini
      </h2>
      <ul className="flex flex-col gap-2.5">
        {history.map((session) => (
          <li key={session.id}>
            <Card size="sm">
              <CardHeader>
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge variant={META_BADGE_VARIANT.sesi}>{session.sesiLabel}</Badge>
                  <Badge variant={META_BADGE_VARIANT.date}>{session.dateLabel}</Badge>
                </div>
                <p className="text-xs font-bold">{session.title}</p>
              </CardHeader>
              <CardContent className="flex items-center justify-between gap-2">
                <Badge variant={META_BADGE_VARIANT.repetisi}>{session.repetisiLabel}</Badge>
                <Badge variant={performanceBadgeVariant(session.badgeKey)}>{performanceBadgeLabel(session.badgeKey)}</Badge>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
      <Link
        href={`/coach/members/${memberId}/riwayat`}
        className={buttonVariants({ variant: "ghost", size: "sm", className: "w-full" })}
      >
        Buku Semua Riwayat Atlet <ChevronRight data-icon="inline-end" />
      </Link>
    </section>
  );
}
