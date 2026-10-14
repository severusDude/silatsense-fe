import { Badge } from "@/components/ui/badge";
import { getInitials, performanceBadgeLabel, performanceBadgeVariant } from "@/components/shared/silat-reference";
import type { MemberDetail } from "@/features/coach/types";

export function MemberDetailProfile({ detail }: { detail: MemberDetail }) {
  return (
    <section aria-labelledby="member-detail-name" className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <span
          role="img"
          aria-label={`Avatar ${detail.name}`}
          className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-secondary text-lg font-bold text-secondary-foreground"
        >
          {getInitials(detail.name)}
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <Badge variant={performanceBadgeVariant(detail.stateKey)}>{performanceBadgeLabel(detail.stateKey)}</Badge>
          <h1 id="member-detail-name" className="truncate text-lg font-bold">
            {detail.name}
          </h1>
          <p className="text-xs text-muted-foreground">NIM {detail.nim}</p>
        </div>
      </div>
      <dl className="grid grid-cols-3 gap-2.5">
        <div className="flex flex-col items-center gap-0.5 rounded-2xl border p-2.5 text-center">
          <dt className="text-[11px] text-muted-foreground">Sabuk</dt>
          <dd className="text-xs font-bold">{detail.beltLabel}</dd>
        </div>
        <div className="flex flex-col items-center gap-0.5 rounded-2xl border p-2.5 text-center">
          <dt className="text-[11px] text-muted-foreground">Kehadiran</dt>
          <dd className="text-xs font-bold">{detail.attendanceLabel}</dd>
        </div>
        <div className="flex flex-col items-center gap-0.5 rounded-2xl border p-2.5 text-center">
          <dt className="text-[11px] text-muted-foreground">Agregat</dt>
          <dd className="text-xs font-bold tabular-nums">{detail.aggregatePct}%</dd>
        </div>
      </dl>
      <div className="flex items-center justify-between gap-3 rounded-2xl border p-3">
        <p className="text-xs text-muted-foreground">Skor agregat biomekanika</p>
        <Badge variant={performanceBadgeVariant(detail.aggregateKey)}>{performanceBadgeLabel(detail.aggregateKey)}</Badge>
      </div>
    </section>
  );
}
