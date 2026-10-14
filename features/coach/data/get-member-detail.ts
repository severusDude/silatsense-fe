import "server-only";

import { cacheLife } from "next/cache";

import { dummyMemberDetail } from "@/features/coach/data/member-detail-dummy";
import type { MemberDetail } from "@/features/coach/types";

export const memberDetailIds = Object.keys(dummyMemberDetail);

export async function getMemberDetail(id: string): Promise<MemberDetail | null> {
  "use cache";
  cacheLife("minutes");
  // TODO: connect backend via lib/api-client.ts (GET /coach/members/[id]) — dummy for now
  return dummyMemberDetail[id] ?? null;
}
