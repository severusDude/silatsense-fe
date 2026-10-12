import { CloudCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function CoachTopNav({ trail = ["Dashboard"] }: { trail?: string[] }) {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-[448px] flex-col px-4 pt-3 pb-2.5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="font-heading flex size-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground shadow-sm">
              S
            </span>
            <span className="font-heading text-base font-bold tracking-tight">SILATSENSE</span>
          </div>
          <span className="flex items-center gap-1.5">
            <span
              role="img"
              aria-label="Avatar pelatih Kang Fauzan"
              className="flex size-8 items-center justify-center rounded-full bg-secondary text-xs font-bold text-secondary-foreground ring-1 ring-border ring-inset"
            >
              KF
            </span>
            <span aria-hidden="true" className="size-2 rounded-full bg-success" />
          </span>
        </div>
        <div className="flex items-center justify-between gap-3 pt-2">
          <p className="min-w-0 flex-1 truncate text-xs font-bold text-primary">{trail.join(" / ")}</p>
          <Badge variant="success">
            <CloudCheck className="size-3" /> Cloud Sinkron
          </Badge>
        </div>
      </div>
    </header>
  );
}
