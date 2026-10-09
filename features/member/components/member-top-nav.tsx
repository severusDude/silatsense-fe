import { CloudCheck, Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";

export function MemberTopNav({ trail = ["Dashboard"] }: { trail?: string[] }) {
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
          <div className="flex items-center gap-2">
            {/* TODO: wire quick-start to the /latihan session flow when the route lands */}
            <span aria-disabled="true" title="Mulai latihan (TODO)" className={buttonVariants({ size: "icon", className: "rounded-full" })}>
              <Play className="size-4" />
            </span>
            <span className="flex items-center gap-1.5 border-l pl-2">
              <span className="flex size-8 items-center justify-center rounded-full bg-secondary text-xs font-bold text-secondary-foreground ring-1 ring-border ring-inset">
                AS
              </span>
              <span aria-hidden="true" className="size-2 rounded-full bg-success" />
            </span>
          </div>
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
