import type { TrainingSession } from "@/features/member/types";

export function SesiPlayback({ session }: { session: TrainingSession }) {
  return (
    <section
      aria-label="Putar ulang rekaman"
      className="flex flex-col gap-2"
    >
      {/* TODO: bind recorded blob via lib/api-client.ts (GET /member/sessions/:slug) when blob store lands — no src in stub */}
      <video
        controls
        aria-label={`${session.trainingName} — putar ulang`}
        className="aspect-[3/4] w-full rounded-2xl border bg-black"
      />
    </section>
  );
}
