import "server-only";

import { cacheLife } from "next/cache";

import { dummyMemberDashboard } from "@/features/member/data/member-dashboard-dummy";
import type { MemberDashboard } from "@/features/member/types";

export async function getMemberDashboard(): Promise<MemberDashboard> {
  "use cache";
  cacheLife("minutes");
  // TODO: connect backend via lib/api-client.ts (GET /member/dashboard) — dummy for now
  return dummyMemberDashboard;
}
