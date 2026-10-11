import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EvaluasiScrubber } from "@/features/member/components/evaluasi-scrubber";
import type { EvaluationSession } from "@/features/member/types";

export function EvaluasiPlayback({ session }: { session: EvaluationSession }) {
  return (
    <section aria-label="Visualisasi postur" className="flex flex-col gap-2">
      <Card>
        <CardContent className="flex flex-col gap-2 p-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-bold">Visualisasi Postur & Freeze-Frame</h2>
            <Badge variant="outline">{session.qualityLabel}</Badge>
          </div>
          {/* TODO: bind recorded blob via lib/api-client.ts (GET /member/evaluations/:slug/video) when blob store lands — no src in stub */}
          {/* TODO(spike): evaluate video playback lib for frame-accurate scrub + 0.5x slow-mo + overlay markers (candidates: vplayer-react, video.js, @saran-ign/video-annotation-tool, @remotion/player) then replace shell — see exa 2026-10-11 */}
          <video
            controls
            aria-label={`${session.techniqueName} — visualisasi postur`}
            className="aspect-[4/3] w-[calc(100%+2rem)] -mx-4 rounded-2xl border bg-black"
          />
          <EvaluasiScrubber />
        </CardContent>
      </Card>
    </section>
  );
}
