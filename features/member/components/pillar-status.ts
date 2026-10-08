import type { PillarStatus } from "@/features/member/types";

export function pillarBadgeVariant(status: PillarStatus): "success" | "warning" {
  return status === "perlu-koreksi" ? "warning" : "success";
}
