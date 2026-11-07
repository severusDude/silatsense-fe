import type { PostureAssessmentViewModel } from "@/features/member/types";

export function EvaluasiPoseThumb({
  posture,
}: {
  posture: PostureAssessmentViewModel;
}) {
  return (
    <div
      role="img"
      aria-label={`Pratinjau pose ${posture.thumbnailLabel} (segera hadir)`}
      className="flex aspect-video w-full flex-col items-center justify-center gap-1 rounded-xl border border-dashed bg-secondary/50"
    >
      {/* TODO: GET /member/sessions/{id}/pose returns one session keyframe, not a per-measurement image. Bind when the pose overlay move lands. */}
      <span className="text-xs font-bold text-foreground">
        Pose: {posture.thumbnailLabel}
      </span>
      <span className="text-[10px] text-muted-foreground">
        Pratinjau visual segera hadir
      </span>
    </div>
  );
}
