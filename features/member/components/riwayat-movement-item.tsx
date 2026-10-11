"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import {
  ChevronDown,
  Footprints,
  Hand,
  PersonStanding,
  Shield,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { HistoryEntry, RiwayatSlug } from "@/features/member/types";

// TODO: replace with per-gerakan Lucide icon — placeholder set
const iconBySlug: Record<RiwayatSlug, typeof Hand> = {
  "kuda-kuda": PersonStanding,
  pukulan: Hand,
  tangkisan: Shield,
  tendangan: Footprints,
};

export function RiwayatMovementItem({
  entry,
  children,
}: {
  entry: HistoryEntry;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const needsFix = entry.status === "perlu-koreksi";
  const Icon = iconBySlug[entry.slug];

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="rounded-2xl border bg-card"
    >
      <CollapsibleTrigger className="flex w-full items-start gap-3 p-3.5 text-left">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted">
          <Icon aria-hidden="true" className="size-5 text-foreground" />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-px">
          <span className="truncate text-sm font-bold text-foreground">
            {entry.techniqueName}
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            {entry.dateLabel} • {entry.timeLabel}
          </span>
          <span className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">
            {entry.summary}
          </span>
          <span className="mt-2 flex items-center justify-between border-t pt-2">
            <Badge variant={needsFix ? "warning" : "success"}>
              {entry.statusLabel}
            </Badge>
            <span className="flex items-center gap-2">
              <span className="flex flex-col items-end">
                <span className="text-sm font-bold text-foreground">
                  {entry.scorePct}%
                </span>
                <span className="text-[9px] text-muted-foreground">
                  {entry.scoreCaption}
                </span>
              </span>
              <span className="flex size-6 items-center justify-center rounded-full border">
                <ChevronDown
                  aria-hidden="true"
                  className={`size-3.5 text-muted-foreground transition-transform motion-reduce:transition-none ${
                    open ? "rotate-180" : ""
                  }`}
                />
              </span>
            </span>
          </span>
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent className="flex flex-col gap-3 bg-muted/70 px-3.5 pb-3.5">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}
