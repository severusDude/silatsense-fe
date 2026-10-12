import type { PostureAssessment } from "@/features/member/types";

export function EvaluasiPoseThumb({
  posture,
}: {
  posture: PostureAssessment;
}) {
  return (
    <div
      role="img"
      aria-label={`Pratinjau pose ${posture.thumbnailLabel} (segera hadir)`}
      className="flex aspect-video w-full flex-col items-center justify-center gap-1 rounded-xl border border-dashed bg-secondary/50"
    >
      {/* TODO: bind pose render via lib/api-client.ts (GET /member/evaluations/:slug/pose/:id) when pose assets land */}
      <span className="text-xs font-bold text-foreground">
        Pose: {posture.thumbnailLabel}
      </span>
      <span className="text-[10px] text-muted-foreground">
        Pratinjau visual segera hadir
      </span>
    </div>
  );
}
