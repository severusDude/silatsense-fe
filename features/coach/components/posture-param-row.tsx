import { CircleCheck, TriangleAlert, CircleHelp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { CoachMemberEvaluationViewModel } from "@/features/coach/types";

export type PostureItem = CoachMemberEvaluationViewModel["postures"][number];

export function PostureParamRow({ posture }: { posture: PostureItem }) {
  const isApproved = posture.status === "sesuai";
  const isNeedsCorrection = posture.status === "perlu-koreksi";
  const Icon = isApproved ? CircleCheck : isNeedsCorrection ? TriangleAlert : CircleHelp;
  const badgeVariant = isApproved ? "success" : isNeedsCorrection ? "warning" : "outline";

  return (
    <li>
      <Card size="sm">
        <CardContent className="flex items-start gap-2.5">
          <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <p className="text-xs font-bold">{posture.name}</p>
              <Badge variant={badgeVariant}>{posture.statusLabel}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">{posture.note ?? posture.reading}</p>
          </div>
        </CardContent>
      </Card>
    </li>
  );
}
