import "server-only";

import { cacheLife } from "next/cache";

import { dummyCoachOverview } from "@/features/coach/data/coach-overview-dummy";
import type { CoachOverview } from "@/features/coach/types";

export async function getCoachOverview(): Promise<CoachOverview> {
  "use cache";
  cacheLife("minutes");
  // TODO: connect backend via lib/api-client.ts (GET /coach/overview) — dummy for now
  return dummyCoachOverview;
}
