import { CircleCheck, TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { performanceBadgeLabel, performanceBadgeVariant } from "@/components/shared/silat-reference";
import type { PostureParam } from "@/features/coach/types";

export function PostureParamRow({ param }: { param: PostureParam }) {
  const ok = param.badgeKey === "sesuai";
  const Icon = ok ? CircleCheck : TriangleAlert;
  return (
    <li className="flex items-start gap-2.5 rounded-2xl border p-3">
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <p className="text-xs font-bold">{param.name}</p>
          <Badge variant={performanceBadgeVariant(param.badgeKey)}>{performanceBadgeLabel(param.badgeKey)}</Badge>
        </div>
        <p className="text-xs text-muted-foreground">{param.note}</p>
      </div>
    </li>
  );
}
