import { BadgeAlert, BadgeCheck, Lightbulb } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { PostureAssessment } from "@/features/member/types";

export function SessionPostureItem({ posture }: { posture: PostureAssessment }) {
  const needsFix = posture.status === "perlu-koreksi";
  const critical = posture.id === "siku-kanan" && needsFix;
  const Icon = needsFix ? BadgeAlert : BadgeCheck;

  return (
    <div
      className={`flex flex-col gap-1.5 rounded-xl border p-3 ${
        critical
          ? "border-l-4 border-destructive border-l-destructive bg-destructive/5"
          : needsFix
            ? "border-warning-border bg-warning/10"
            : "border-success-border bg-success/10"
      }`}
    >
      <p className="flex items-center gap-2">
        <span
          className={`flex size-7 shrink-0 items-center justify-center rounded-full ${
            needsFix ? "bg-warning-foreground text-white" : "bg-success-foreground text-white"
          }`}
        >
          <Icon aria-hidden="true" className="size-4" />
        </span>
        <span className="min-w-0 flex-1 text-xs font-bold text-foreground">
          {posture.name}
        </span>
        <Badge variant={critical ? "destructive" : needsFix ? "warning" : "success"}>
          {posture.statusLabel}
        </Badge>
      </p>
      <p className="text-[11px] leading-relaxed text-foreground">
        <span className="font-bold">Catatan: </span>
        <span className="text-muted-foreground">{posture.detail}</span>
      </p>
      {needsFix && posture.correctionCue ? (
        <p className="flex items-start gap-1.5 rounded-xl border border-warning-border bg-warning/10 p-2 text-[11px] font-semibold">
          <Lightbulb aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
          <span>
            <span className="font-bold">Koreksi: </span>
            {posture.correctionCue}
          </span>
        </p>
      ) : null}
    </div>
  );
}
