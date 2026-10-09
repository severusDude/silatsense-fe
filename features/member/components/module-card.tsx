import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ImagePlaceholder } from "@/features/member/components/shared/image-placeholder";
import type { TrainingModule } from "@/features/member/types";

export function ModuleCard({ module }: { module: TrainingModule }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-4">
        <div className="grid">
          <ImagePlaceholder label={module.name} className="col-start-1 row-start-1" />
          <Badge
            variant="secondary"
            className="col-start-1 row-start-1 m-2 self-end justify-self-start bg-secondary/80 backdrop-blur-sm"
          >
            {module.orderLabel}
          </Badge>
        </div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-0.5">
            <h2 className="text-sm font-bold">{module.name}</h2>
            <p className="text-xs text-muted-foreground">{module.levelLabel}</p>
          </div>
          {module.estimateLabel ? (
            <Badge variant="outline" className="shrink-0">
              <Clock className="size-3" aria-hidden="true" /> {module.estimateLabel}
            </Badge>
          ) : null}
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">{module.description}</p>
        <Link
          href={`/latihan/${module.slug}`}
          className={buttonVariants({ className: "w-full" })}
        >
          Mulai Latihan <ArrowRight data-icon="inline-end" />
        </Link>
      </CardContent>
    </Card>
  );
}
