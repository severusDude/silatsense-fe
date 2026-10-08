import "server-only";

import { cacheLife } from "next/cache";

import { dummyMemberTraining } from "@/features/member/data/member-training-dummy";
import type { MemberTraining } from "@/features/member/types";

export async function getTrainingModules(): Promise<MemberTraining> {
  "use cache";
  cacheLife("minutes");
  // TODO: connect backend via lib/api-client.ts (GET /member/training-modules) — dummy for now
  return dummyMemberTraining;
}
