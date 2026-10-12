import "server-only";

import { cacheLife } from "next/cache";

import {
  dummyEvaluasiBySlug,
  evaluasiSlugs,
} from "@/features/member/data/evaluasi-dummy";
import type {
  EvaluasiSlug,
  EvaluationSession,
} from "@/features/member/types";

export { evaluasiSlugs };

function isEvaluasiSlug(slug: string): slug is EvaluasiSlug {
  return (evaluasiSlugs as string[]).includes(slug);
}

export async function getEvaluasi(
  slug: string,
): Promise<EvaluationSession | null> {
  "use cache";
  cacheLife("minutes");
  // TODO: connect backend via lib/api-client.ts (GET /member/evaluations/:slug) — dummy for now
  if (!isEvaluasiSlug(slug)) return null;
  return dummyEvaluasiBySlug[slug];
}
