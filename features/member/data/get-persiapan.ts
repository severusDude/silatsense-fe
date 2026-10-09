import "server-only";

import { cacheLife } from "next/cache";

import {
  dummyCameras,
  dummyPersiapanBySlug,
  persiapanSlugs,
} from "@/features/member/data/persiapan-dummy";
import type {
  CameraDevice,
  PersiapanDetail,
  PersiapanSlug,
} from "@/features/member/types";

export { persiapanSlugs };

function isPersiapanSlug(slug: string): slug is PersiapanSlug {
  return (persiapanSlugs as string[]).includes(slug);
}

export async function getPersiapan(
  slug: string,
): Promise<PersiapanDetail | null> {
  "use cache";
  cacheLife("minutes");
  // TODO: connect backend via lib/api-client.ts (GET /member/training-prep/:slug) — dummy for now
  if (!isPersiapanSlug(slug)) return null;
  return dummyPersiapanBySlug[slug];
}

export async function getCameras(): Promise<CameraDevice[]> {
  "use cache";
  cacheLife("minutes");
  // TODO: connect backend via lib/api-client.ts (GET /member/cameras) — dummy for now
  return dummyCameras;
}
