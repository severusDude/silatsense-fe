import "server-only";

import { cacheLife } from "next/cache";

import { dummyRekamBySlug } from "@/features/member/data/rekam-dummy";
import { persiapanSlugs } from "@/features/member/data/persiapan-dummy";
import type {
  PersiapanSlug,
  RekamSession,
} from "@/features/member/types";

export { persiapanSlugs as rekamSlugs };

function isRekamSlug(slug: string): slug is PersiapanSlug {
  return (persiapanSlugs as string[]).includes(slug);
}

export async function getRekam(slug: string): Promise<RekamSession | null> {
  "use cache";
  cacheLife("minutes");
  // TODO: connect backend via lib/api-client.ts (GET /member/record-config/:slug) — dummy for now
  if (!isRekamSlug(slug)) return null;
  return dummyRekamBySlug[slug];
}
