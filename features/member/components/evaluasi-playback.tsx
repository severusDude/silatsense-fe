import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MediaUnavailable } from "@/features/member/components/media-unavailable";
import type { EvaluationViewModel } from "@/features/member/types";

export function EvaluasiPlayback({
  evaluation,
}: {
  evaluation: EvaluationViewModel;
}) {
  return (
    <section aria-label="Rekaman evaluasi" className="flex flex-col gap-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-bold">Rekaman Evaluasi</CardTitle>
          <CardAction>
            <Badge variant="outline">{evaluation.mediaMetaLabel}</Badge>
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {evaluation.mediaStatus === "available" ? (
            <video
              controls
              preload="metadata"
              src={`/api/member/sessions/${evaluation.sessionId}/video`}
              aria-label={`${evaluation.techniqueName} — rekaman evaluasi`}
              className="aspect-[4/3] -mx-6 min-w-[calc(100%_+_3rem)] rounded-2xl border bg-black"
            />
          ) : (
            <MediaUnavailable
              status={evaluation.mediaStatus}
              className="aspect-[4/3]"
            />
          )}
        </CardContent>
      </Card>
    </section>
  );
}
