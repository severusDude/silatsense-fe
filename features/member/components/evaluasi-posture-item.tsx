"use client";

import { useState } from "react";
import {
  BadgeAlert,
  BadgeCheck,
  ChevronDown,
  CircleDashed,
  Lightbulb,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { EvaluasiPoseThumb } from "@/features/member/components/evaluasi-pose-thumb";
import type {
  PostureAssessmentViewModel,
  PostureStatusViewModel,
} from "@/features/member/types";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<
  PostureStatusViewModel,
  {
    icon: typeof BadgeCheck;
    container: string;
    iconBox: string;
    badge: "success" | "warning" | "secondary";
  }
> = {
  sesuai: {
    icon: BadgeCheck,
    container: "border-success-border bg-success",
    iconBox: "bg-success-foreground text-white",
    badge: "success",
  },
  "perlu-koreksi": {
    icon: BadgeAlert,
    container: "border-warning-border bg-warning",
    iconBox: "bg-warning-foreground text-white",
    badge: "warning",
  },
  "tidak-dinilai": {
    icon: CircleDashed,
    container: "border-border bg-secondary/40",
    iconBox: "bg-muted text-muted-foreground",
    badge: "secondary",
  },
};

export function EvaluasiPostureItem({
  posture,
}: {
  posture: PostureAssessmentViewModel;
}) {
  const [open, setOpen] = useState(false);
  const style = STATUS_STYLES[posture.status];
  const Icon = style.icon;
  const needsFix = posture.status === "perlu-koreksi";

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className={cn("rounded-xl border", style.container)}
    >
      <CollapsibleTrigger className="flex min-h-[64px] w-full items-center gap-2.5 p-3 text-left">
        <span
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-full",
            style.iconBox,
          )}
        >
          <Icon aria-hidden="true" className="size-5" />
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-bold text-foreground">
            {posture.name}
          </span>
          <span className="truncate text-[11px] text-muted-foreground">
            {posture.reading}
          </span>
        </span>
        <Badge variant={style.badge}>{posture.statusLabel}</Badge>
        <ChevronDown
          aria-hidden="true"
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform motion-reduce:transition-none",
            open && "rotate-180",
          )}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="flex flex-col gap-2 px-3 pb-3">
        <p className="text-sm leading-relaxed text-foreground">
          {posture.detail}
        </p>
        {posture.correctionCue ? (
          <p
            className={cn(
              "flex items-start gap-2 rounded-xl border p-2.5 text-xs font-semibold",
              needsFix
                ? "border-warning-border bg-warning text-warning-foreground"
                : "border-border bg-card text-foreground",
            )}
          >
            <Lightbulb aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            {posture.correctionCue}
          </p>
        ) : null}
        {needsFix ? <EvaluasiPoseThumb posture={posture} /> : null}
      </CollapsibleContent>
    </Collapsible>
  );
}
