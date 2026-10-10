import { ImagePlaceholder } from "@/features/member/components/shared/image-placeholder";
import type { TrainingSession } from "@/features/member/types";

export function SesiPlayback({ session }: { session: TrainingSession }) {
  return (
    <section
      aria-label="Putar ulang rekaman"
      className="flex flex-col gap-2"
    >
      <div className="grid aspect-[3/4] overflow-hidden rounded-2xl border bg-card shadow-sm">
        <ImagePlaceholder
          label={session.trainingName}
          className="col-start-1 row-start-1 h-full rounded-none border-0"
        />
      </div>
      {/* TODO: replace placeholder with <video controls> via lib/api-client.ts (GET /member/sessions/:slug) when blob store lands — no src in stub */}
      <video
        controls
        aria-label={`${session.trainingName} — putar ulang`}
        className="w-full rounded-2xl border bg-black"
      />
    </section>
  );
}
