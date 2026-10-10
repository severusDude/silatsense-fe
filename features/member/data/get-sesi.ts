import "server-only";

import { cacheLife } from "next/cache";

import { dummySesiBySlug } from "@/features/member/data/sesi-dummy";
import { persiapanSlugs } from "@/features/member/data/persiapan-dummy";
import type {
  PersiapanSlug,
  TrainingSession,
} from "@/features/member/types";

export { persiapanSlugs as sesiSlugs };

function isSesiSlug(slug: string): slug is PersiapanSlug {
  return (persiapanSlugs as string[]).includes(slug);
}

export async function getSesi(slug: string): Promise<TrainingSession | null> {
  "use cache";
  cacheLife("minutes");
  // TODO: connect backend via lib/api-client.ts (GET /member/sessions/:slug) — dummy for now
  if (!isSesiSlug(slug)) return null;
  return dummySesiBySlug[slug];
}
