import { BadgeAlert, BadgeCheck } from "lucide-react";
import type { RiwayatParam } from "@/features/member/types";

export function RiwayatParamChips({ params }: { params: RiwayatParam[] }) {
  return (
    <div className="grid grid-cols-2 gap-1.5">
      {params.map((param) => {
        const Icon = param.deviated ? BadgeAlert : BadgeCheck;
        return (
          <div
            key={param.id}
            className={`flex items-start gap-1.5 rounded-xl border p-2 ${
              param.id === "pergelangan" ? "col-span-2" : ""
            } ${
              param.deviated
                ? "border-warning-border bg-warning"
                : "border-success-border bg-success"
            }`}
          >
            <Icon
              aria-hidden="true"
              className={`size-4 shrink-0 ${
                param.deviated ? "text-warning-foreground" : "text-success-foreground"
              }`}
            />
            <div className="flex min-w-0 flex-1 flex-col">
              <p className="truncate text-[11px] font-bold text-foreground">{param.name}</p>
              <p
                className={`truncate text-[10px] font-medium ${
                  param.deviated ? "text-warning-foreground" : "text-success-foreground"
                }`}
              >
                {param.reading}
              </p>
            </div>
            {param.actionLabel ? (
              <span className="shrink-0 rounded border border-warning-border bg-card px-1.5 py-0.5 text-[9px] font-semibold text-warning-foreground">
                {param.actionLabel}
              </span>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
