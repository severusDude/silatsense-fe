import "server-only";

import { cacheLife } from "next/cache";

import {
  afterSessionDetail,
  beforeSessionDetail,
  sessionDetailIds,
} from "@/features/member/data/session-detail-dummy";
import type { SessionDetail } from "@/features/member/types";

export { sessionDetailIds };

export async function getSessionDetail(
  id: string,
): Promise<SessionDetail | null> {
  "use cache";
  cacheLife("minutes");
  // TODO: connect backend via lib/api-client.ts (GET /member/history/:id) — dummy for now
  if (id === afterSessionDetail.id) return afterSessionDetail;
  if (id === beforeSessionDetail.id) return beforeSessionDetail;
  return null;
}
