import { BadgeAlert, BadgeCheck, Lightbulb, MessageSquareText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { PostureAssessmentViewModel } from "@/features/member/types";

export function SessionPostureItem({
  posture,
}: {
  posture: PostureAssessmentViewModel;
}) {
  const needsFix = posture.status === "perlu-koreksi";
  const hasAiDeviation = posture.deviation && posture.deviation !== "normal";
  const hasCoachNeedsWork = Boolean(posture.coachNeedsWork);
  const Icon = needsFix ? BadgeAlert : BadgeCheck;

  return (
    <div
      className={`flex flex-col gap-1.5 rounded-xl border p-3 ${
        hasAiDeviation && hasCoachNeedsWork
          ? "border-l-4 border-warning border-l-destructive bg-warning/10"
          : needsFix
            ? "border-warning-border bg-warning/10"
            : "border-success-border bg-success/10"
      }`}
    >
      <div className="flex items-center gap-2">
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
        <div className="flex flex-wrap items-center gap-1">
          {hasAiDeviation ? (
            <Badge variant="destructive">Deviasi AI</Badge>
          ) : null}
          {hasCoachNeedsWork ? (
            <Badge variant="warning">Catatan Pelatih</Badge>
          ) : null}
          <Badge
            variant={
              posture.status === "sesuai"
                ? "success"
                : posture.status === "perlu-koreksi"
                  ? "warning"
                  : "secondary"
            }
          >
            {posture.statusLabel}
          </Badge>
        </div>
      </div>

      {posture.reading && posture.reading !== "—" ? (
        <p className="text-[10px] font-medium text-muted-foreground">
          {posture.reading}
        </p>
      ) : null}

      <p className="text-[11px] leading-relaxed text-foreground">
        <span className="font-bold">Catatan: </span>
        <span className="text-muted-foreground">{posture.detail}</span>
      </p>

      {posture.coachNote && posture.coachNote !== posture.detail ? (
        <p className="flex items-start gap-1.5 rounded-xl border border-muted bg-muted/20 p-2 text-[11px]">
          <MessageSquareText aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
          <span>
            <span className="font-bold">Arahan Pelatih: </span>
            {posture.coachNote}
          </span>
        </p>
      ) : null}

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
