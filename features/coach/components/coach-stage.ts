import type { AthleteStage } from "@/features/coach/types";

export function stageBadgeVariant(stage: AthleteStage): "success" | "warning" {
  return stage === "remediasi" ? "warning" : "success";
}
