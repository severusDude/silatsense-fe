import { MediaUnavailable } from "@/features/member/components/media-unavailable";
import type { SessionViewModel } from "@/features/member/types";

export function SesiPlayback({ session }: { session: SessionViewModel }) {
  return (
    <section aria-label="Putar ulang rekaman" className="flex flex-col gap-2">
      {session.mediaStatus === "available" ? (
        <video
          controls
          preload="metadata"
          src={`/api/member/sessions/${session.id}/video`}
          aria-label={`${session.trainingName} — putar ulang`}
          className="aspect-[3/4] w-full rounded-2xl border bg-black"
        />
      ) : (
        <MediaUnavailable
          status={session.mediaStatus}
          expiresAtLabel={session.mediaExpiresAtLabel}
          className="aspect-[3/4]"
        />
      )}
    </section>
  );
}
