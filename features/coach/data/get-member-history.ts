import "server-only";

import { cacheLife } from "next/cache";

import { dummyMemberHistory } from "@/features/coach/data/member-history-dummy";
import type { MemberHistory } from "@/features/coach/types";

export const memberHistoryIds = Object.keys(dummyMemberHistory);

export async function getMemberHistory(id: string): Promise<MemberHistory | null> {
  "use cache";
  cacheLife("minutes");
  // TODO: connect backend via lib/api-client.ts (GET /coach/members/[id]/history?page=N) — dummy for now
  return Object.hasOwn(dummyMemberHistory, id) ? dummyMemberHistory[id] : null;
}
