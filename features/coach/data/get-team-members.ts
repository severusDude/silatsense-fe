import "server-only";

import { cacheLife } from "next/cache";

import { dummyTeamMembers, dummyTeamMemberStats } from "@/features/coach/data/team-members-dummy";
import type { CoachStat, TeamMembers } from "@/features/coach/types";

export async function getTeamMembers(): Promise<TeamMembers> {
  "use cache";
  cacheLife("minutes");
  // TODO: connect backend via lib/api-client.ts (GET /coach/members) — dummy for now
  return dummyTeamMembers;
}

export async function getTeamMemberStats(): Promise<CoachStat[]> {
  "use cache";
  cacheLife("minutes");
  // TODO: connect backend via lib/api-client.ts (GET /coach/members) — dummy for now
  return dummyTeamMemberStats;
}
