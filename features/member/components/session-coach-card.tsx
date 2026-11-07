"use client";

import { useState } from "react";
import { BadgeCheck, CalendarDays, ChevronDown, History } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { SessionDetailViewModel } from "@/features/member/types";

export function SessionCoachCard({ session }: { session: SessionDetailViewModel }) {
  const [historyOpen, setHistoryOpen] = useState(false);

  const isApproved = session.reviewDecision === "approved";
  const isNeedsRevision = session.reviewDecision === "needs_revision";
  const badgeVariant = isApproved ? "success" : isNeedsRevision ? "warning" : "secondary";

  // Prior reviews: exclude current revision if multiple, or all history
  const priorReviews =
    session.reviewHistory.length > 1
      ? session.reviewHistory.slice(0, session.reviewHistory.length - 1)
      : [];
  const priorCount = priorReviews.length + session.legacyNotes.length;
  const showPriorHistory = session.reviewHistory.length > 1 || session.legacyNotes.length > 0;

  return (
    <section aria-label="Pelatih penilai" className="flex flex-col gap-2">
      <Card>
        <CardHeader className="flex flex-row items-start gap-3">
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
        <CardContent className="flex flex-col gap-2.5">
          {/* Decision Banner */}
          <div className="flex items-center justify-between gap-2 rounded-xl bg-secondary/50 px-3 py-2">
            <div className="flex items-center gap-2">
              <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                Keputusan sidang pelatih
              </p>
              {session.reviewRevision ? (
                <span className="text-[10px] font-medium text-muted-foreground">
                  (Rev #{session.reviewRevision})
                </span>
              ) : null}
            </div>
            <Badge variant={badgeVariant}>{session.reviewDecisionLabel}</Badge>
          </div>

          {/* Remedial Focus or Approval Box */}
          {isNeedsRevision ? (
            <div className="flex flex-col gap-1.5 rounded-xl border p-3">
              {session.decidedAtLabel ? (
                <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <CalendarDays aria-hidden="true" className="size-3.5 shrink-0" />
                  {session.decidedAtLabel}
                </p>
              ) : null}
              <p className="flex items-center gap-1.5 text-xs font-bold tracking-wide uppercase">
                <BadgeCheck aria-hidden="true" className="size-4 shrink-0 text-warning-foreground" />
                Tahap remidiasi teknis
              </p>
              <p className="text-[11px] text-muted-foreground">
                Fokus: <span className="font-bold text-foreground">{session.focusTechnique}</span>
              </p>
            </div>
          ) : isApproved && session.decidedAtLabel ? (
            <div className="flex flex-col gap-1 rounded-xl border border-success-border bg-success/10 p-3">
              <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <CalendarDays aria-hidden="true" className="size-3.5 shrink-0" />
                Ditinjau pada: {session.decidedAtLabel}
              </p>
              <p className="text-xs font-semibold text-success-foreground">
                Gerakan dinyatakan memenuhi standar teknik oleh pelatih.
              </p>
            </div>
          ) : null}

          {/* Coach Note */}
          {session.reviewNote ? (
            <div className="flex flex-col gap-1 rounded-xl border bg-muted/20 p-3">
              <p className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                Catatan Evaluasi
              </p>
              <p className="text-xs leading-relaxed text-foreground">
                {session.reviewNote}
              </p>
            </div>
          ) : null}

          {/* Collapsible Review History */}
          {showPriorHistory ? (
            <Collapsible
              open={historyOpen}
              onOpenChange={setHistoryOpen}
              className="rounded-xl border bg-card"
            >
              <CollapsibleTrigger className="flex w-full items-center justify-between p-3 text-left">
                <span className="flex items-center gap-2 text-xs font-bold text-foreground">
                  <History aria-hidden="true" className="size-3.5 text-muted-foreground" />
                  Riwayat Tinjauan Sebelumnya ({priorCount})
                </span>
                <ChevronDown
                  aria-hidden="true"
                  className={`size-4 text-muted-foreground transition-transform duration-200 ${
                    historyOpen ? "rotate-180" : ""
                  }`}
                />
              </CollapsibleTrigger>
              <CollapsibleContent className="flex flex-col gap-2.5 border-t p-3 pt-2">
                {priorReviews.map((rev) => (
                  <div key={rev.id} className="flex flex-col gap-1 rounded-lg border bg-muted/10 p-2.5">
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="text-[11px] font-bold text-foreground">
                        Revisi #{rev.revision} • {rev.authorName}
                      </span>
                      <Badge variant={rev.decision === "approved" ? "success" : "warning"}>
                        {rev.decisionLabel}
                      </Badge>
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {rev.publishedAtLabel}
                    </span>
                    {rev.note ? (
                      <p className="text-xs text-muted-foreground">{rev.note}</p>
                    ) : null}
                  </div>
                ))}
                {session.legacyNotes.map((note) => (
                  <div key={note.id} className="flex flex-col gap-1 rounded-lg border bg-muted/10 p-2.5">
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="text-[11px] font-bold text-foreground">
                        Catatan • {note.authorName}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {note.publishedAtLabel}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{note.text}</p>
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>
          ) : null}
        </CardContent>
      </Card>
    </section>
  );
}
