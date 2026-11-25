import { getPose } from "@/features/member/data/get-pose";
import { PoseVideoPlayer } from "@/features/member/components/pose-video-player";
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

export async function EvaluasiPlayback({
  evaluation,
}: {
  evaluation: EvaluationViewModel;
}) {
  const pose = evaluation.mediaStatus === "available" ? await getPose(evaluation.sessionId, "member") : null;
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
            <PoseVideoPlayer src={`/api/member/sessions/${evaluation.sessionId}/video`} timeline={pose?.timeline} comparison={evaluation.coachComparison} poseError={pose?.error} />
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
