import "server-only";

import { cacheLife } from "next/cache";

import { dummyMemberHistory } from "@/features/member/data/riwayat-dummy";
import type { MemberHistory } from "@/features/member/types";

export async function getRiwayat(): Promise<MemberHistory> {
  "use cache";
  cacheLife("minutes");
  // TODO: connect backend via lib/api-client.ts (GET /member/history) — dummy for now
  return dummyMemberHistory;
}
