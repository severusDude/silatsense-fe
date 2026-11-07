import type { PillarStatus } from "@/features/member/types";

export function pillarBadgeVariant(
  status: PillarStatus,
): "success" | "warning" | "secondary" {
  if (status === "perlu-koreksi") return "warning";
  if (status === "belum-dinilai") return "secondary";
  return "success";
}
