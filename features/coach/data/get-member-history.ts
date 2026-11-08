import "server-only";

import { cache } from "react";
import {
  memberSessionsApiV1CoachRosterMemberIdSessionsGet,
  type HistoryPage,
} from "@/api";
import {
  zHistoryPage,
  zMemberSessionsApiV1CoachRosterMemberIdSessionsGetResponse,
} from "@/api/zod.gen";
import { getAccessToken } from "@/features/auth/data/session";
import { toCoachMemberHistoryPage } from "@/features/coach/data/coach-members-mapper";
import type { CoachMemberHistoryPageViewModel } from "@/features/coach/types";

export interface CoachMemberHistoryQueryParams {
  limit?: number;
  cursor?: string | null;
  movementSlug?: "kuda-kuda" | "pukulan" | "tangkisan" | "tendangan" | null;
  processingStatus?: "queued" | "processing" | "completed" | "failed" | null;
  reviewStatus?: "pending" | "needs_revision" | "approved" | null;
}

export const getCoachMemberSessionsDto = cache(
  async (
    memberId: string,
    query?: CoachMemberHistoryQueryParams,
  ): Promise<HistoryPage | null> => {
    const token = await getAccessToken();
    if (!token) {
      return null;
    }

    const sanitizedQuery = query
      ? {
          limit: query.limit,
          cursor: query.cursor ?? undefined,
          movementSlug: query.movementSlug ?? undefined,
          processingStatus: query.processingStatus ?? undefined,
          reviewStatus: query.reviewStatus ?? undefined,
        }
      : undefined;

    const { data, error, response } =
      await memberSessionsApiV1CoachRosterMemberIdSessionsGet({
        path: { member_id: memberId },
        query: sanitizedQuery,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
        throwOnError: false,
      });

    if (response?.status === 401 || response?.status === 404) {
      return null;
    }

    if (error || !data) {
      throw new Error(
        `Failed to fetch coach member sessions (status: ${response?.status ?? "unknown"}): ${
          typeof error === "string" ? error : "Coach member sessions service error"
        }`,
      );
    }

    zHistoryPage.parse(data);
    return zMemberSessionsApiV1CoachRosterMemberIdSessionsGetResponse.parse(data);
  },
);

export const getCoachMemberHistory = cache(
  async (
    memberId: string,
    query?: CoachMemberHistoryQueryParams,
  ): Promise<CoachMemberHistoryPageViewModel | null> => {
    const sessions = await getCoachMemberSessionsDto(memberId, query);
    if (!sessions) {
      return null;
    }

    return toCoachMemberHistoryPage(sessions, memberId, query?.limit ?? 10);
  },
);
