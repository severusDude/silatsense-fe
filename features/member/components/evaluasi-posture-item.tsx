"use client";

import { useState } from "react";
import { BadgeAlert, BadgeCheck, ChevronDown, Lightbulb } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { EvaluasiPoseThumb } from "@/features/member/components/evaluasi-pose-thumb";
import type { PostureAssessment } from "@/features/member/types";

export function EvaluasiPostureItem({
  posture,
}: {
  posture: PostureAssessment;
}) {
  const [open, setOpen] = useState(false);
  const needsFix = posture.status === "perlu-koreksi";
  const Icon = needsFix ? BadgeAlert : BadgeCheck;

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className={`rounded-xl border ${
        needsFix ? "border-warning-border bg-warning" : "border-success-border bg-success"
      }`}
    >
      <CollapsibleTrigger className="flex min-h-[64px] w-full items-center gap-2.5 p-3 text-left">
        <span
          className={`flex size-8 shrink-0 items-center justify-center rounded-full ${
            needsFix ? "bg-warning-foreground text-white" : "bg-success-foreground text-white"
          }`}
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
        <Badge variant={needsFix ? "warning" : "success"}>
          {posture.statusLabel}
        </Badge>
        <ChevronDown
          aria-hidden="true"
          className={`size-4 shrink-0 text-muted-foreground transition-transform motion-reduce:transition-none ${
            open ? "rotate-180" : ""
          }`}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="flex flex-col gap-2 px-3 pb-3">
        <p className="text-sm leading-relaxed text-foreground">
          {posture.detail}
        </p>
        {needsFix ? (
          <p
            className={`flex items-start gap-2 rounded-xl border p-2.5 text-xs font-semibold ${
              needsFix
                ? "border-warning-border bg-warning text-warning-foreground"
                : "border-success-border bg-success text-success-foreground"
            }`}
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
