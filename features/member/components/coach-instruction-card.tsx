import { BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { GuideItemViewModel } from "@/features/member/types";

export function MovementGuideCard({ guide }: { guide: GuideItemViewModel }) {
  return (
    <Card>
      <CardContent className="flex items-start gap-3 p-4">
        <span
          aria-hidden="true"
          className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm"
        >
          <BookOpen className="size-5" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-xs font-bold tracking-wide">PANDUAN GERAKAN</h2>
            <Badge variant="secondary" className="max-w-[60%] truncate">
              {guide.source}
            </Badge>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {guide.text}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
