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
import type {
  HistoryEntryViewModel,
  HistoryReviewBadgeStatus,
  TrainingModuleSlug,
} from "@/features/member/types";

// TODO: replace with per-gerakan Lucide icon — placeholder set
const iconBySlug: Record<TrainingModuleSlug, typeof Hand> = {
  "kuda-kuda": PersonStanding,
  pukulan: Hand,
  tangkisan: Shield,
  tendangan: Footprints,
};

const badgeVariantByStatus: Record<
  HistoryReviewBadgeStatus,
  "success" | "warning" | "secondary" | "outline" | "destructive"
> = {
  sesuai: "success",
  "perlu-koreksi": "warning",
  menunggu: "secondary",
  diproses: "outline",
  gagal: "destructive",
};

export function RiwayatMovementItem({
  entry,
  children,
}: {
  entry: HistoryEntryViewModel;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const Icon = iconBySlug[entry.slug] ?? PersonStanding;
  const badgeVariant = badgeVariantByStatus[entry.status] ?? "secondary";

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
          <span className="text-[11px] text-muted-foreground">
            {entry.dateLabel} • {entry.timeLabel}
          </span>
          <span className="line-clamp-1 pt-0.5 text-[11px] text-muted-foreground">
            {entry.summary}
          </span>
        </span>
        <span className="flex shrink-0 flex-col items-end gap-1">
          <Badge variant={badgeVariant}>{entry.statusLabel}</Badge>
          <span className="flex items-center gap-1">
            <span className="flex flex-col items-end">
              <span className="text-sm font-bold text-foreground">
                {entry.scoreLabel}
              </span>
              <span className="text-[9px] text-muted-foreground">
                {entry.scoreCaption}
              </span>
            </span>
            <ChevronDown
              aria-hidden="true"
              className={`size-4 text-muted-foreground transition-transform duration-200 motion-reduce:transition-none ${
                open ? "rotate-180" : ""
              }`}
            />
          </span>
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent className="flex flex-col gap-3 border-t p-3.5 pt-3">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}
