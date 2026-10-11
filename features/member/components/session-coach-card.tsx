import { BadgeCheck, CalendarDays } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { SessionDetail } from "@/features/member/types";

export function SessionCoachCard({ session }: { session: SessionDetail }) {
  const isRemidiasi = session.decision === "remidiasi";

  return (
    <section aria-label="Pelatih penilai" className="flex flex-col gap-2">
      <Card>
        <CardHeader className="flex flex-row items-start gap-3">
          {/* TODO: replace with real coach photo when backend binds media (GET /member/history/:id) */}
          <span
            aria-hidden="true"
            className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-secondary text-lg font-bold text-foreground"
          >
            {session.coach.initials}
          </span>
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="truncate text-sm font-bold text-foreground">
              {session.coach.name}
            </span>
            <span className="text-[11px] leading-snug text-muted-foreground">
              {session.coach.role}
            </span>
          </span>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2 rounded-xl bg-warning/10 px-3 py-2">
            <p className="text-[10px] font-bold tracking-widest text-warning-foreground uppercase">
              Keputusan sidang pelatih
            </p>
            <Badge variant="warning">Menunggu</Badge>
          </div>
          {isRemidiasi ? (
            <div className="flex flex-col gap-1.5 rounded-xl border p-3">
              <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <CalendarDays aria-hidden="true" className="size-3.5 shrink-0" />
                {session.decidedAtLabel}
              </p>
              <p className="flex items-center gap-1.5 text-xs font-bold tracking-wide uppercase">
                <BadgeCheck aria-hidden="true" className="size-4 shrink-0 text-warning-foreground" />
                Tahap remidiasi teknis
              </p>
              <p className="text-[11px] text-muted-foreground">
                Fokus: <span className="font-bold text-foreground">{session.focusTechnique}</span>
              </p>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </section>
  );
}
