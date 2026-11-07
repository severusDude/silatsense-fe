import type { RetryOut } from "@/api";

/**
 * D15 pins the upload's `retryOf` to the **source** session, not the follow-up
 * id. If the BE later confirms the opposite, this is the one line to change.
 */
export function retryRecordingHref(slug: string, followUp: RetryOut): string {
  const retryOf = followUp.sourceSessionId;
  return `/latihan/${slug}/rekam?retryOf=${encodeURIComponent(retryOf)}`;
}
