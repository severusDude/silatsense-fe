import "server-only";

import { cacheLife } from "next/cache";

import { dummyProfileForRole } from "@/features/profile/data/profile-dummy";
import type { Profile, ProfileRole } from "@/features/profile/types";

export async function getProfile(role: ProfileRole): Promise<Profile | null> {
  "use cache";
  cacheLife("minutes");
  // TODO: connect backend via lib/api-client.ts (GET /member/profile, GET /coach/profile) - dummy for now
  return dummyProfileForRole(role);
}
