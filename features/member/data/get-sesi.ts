import "server-only";

import { cacheLife } from "next/cache";

import { dummySesiBySlug } from "@/features/member/data/sesi-dummy";
import { TRAINING_MODULE_SLUGS } from "@/features/member/data/training-mapper";
import type {
  PersiapanSlug,
  TrainingSession,
} from "@/features/member/types";

export { TRAINING_MODULE_SLUGS as sesiSlugs };

function isSesiSlug(slug: string): slug is PersiapanSlug {
  return (TRAINING_MODULE_SLUGS as readonly string[]).includes(slug);
}

export async function getSesi(slug: string): Promise<TrainingSession | null> {
  "use cache";
  cacheLife("minutes");
  // TODO: connect backend via lib/api-client.ts (GET /member/sessions/:slug) — dummy for now
  if (!isSesiSlug(slug)) return null;
  return dummySesiBySlug[slug];
}
