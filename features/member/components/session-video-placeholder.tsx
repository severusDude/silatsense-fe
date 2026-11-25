import { getPose } from "@/features/member/data/get-pose";
import { PoseVideoPlayer } from "@/features/member/components/pose-video-player";
import { AlertCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { SessionDetailViewModel } from "@/features/member/types";

export async function SessionVideoPlaceholder({
  session,
}: {
  session: SessionDetailViewModel;
}) {
  const isAvailable = session.session.mediaStatus === "available";

  const pose = isAvailable ? await getPose(session.id, "member") : null;
  return (
    <section aria-label="Tinjauan kinematika" className="flex flex-col gap-2">
      <Card>
        <CardHeader>
          <CardTitle>{session.techniqueName}</CardTitle>
          <CardDescription>{session.techniqueDesc}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {isAvailable ? (
            <div className="-mx-(--card-spacing) -mb-(--card-spacing) aspect-video w-auto overflow-hidden bg-black">
              <PoseVideoPlayer src={`/api/member/sessions/${session.id}/video`} timeline={pose?.timeline} comparison={session.evaluation?.coachComparison} poseError={pose?.error} />
            </div>
          ) : (
            <div
              role="img"
              aria-label="Media rekaman tidak tersedia"
              className="-mx-(--card-spacing) -mb-(--card-spacing) flex aspect-video w-auto flex-col items-center justify-center gap-2 bg-muted/40 p-4 text-center"
            >
              <AlertCircle aria-hidden="true" className="size-8 text-muted-foreground" />
              <p className="text-xs font-semibold text-foreground">
                Rekaman video tidak tersedia ({session.session.mediaStatusLabel})
              </p>
              <p className="max-w-xs text-[11px] text-muted-foreground">
                Masa retensi video rekaman telah berakhir atau media telah dihapus. Data evaluasi dan catatan pelatih tetap tersimpan.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
