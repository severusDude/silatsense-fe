import "server-only";

import { cache } from "react";
import {
  memberDetailApiV1CoachRosterMemberIdGet,
  memberSessionsApiV1CoachRosterMemberIdSessionsGet,
  sessionDetailApiV1CoachSessionsSessionIdGet,
  type CoachSessionDetail,
  type HistoryPage,
  type RosterDetail,
} from "@/api";
import {
  zCoachSessionDetail,
  zHistoryPage,
  zMemberDetailApiV1CoachRosterMemberIdGetResponse,
  zMemberSessionsApiV1CoachRosterMemberIdSessionsGetResponse,
  zRosterDetail,
  zSessionDetailApiV1CoachSessionsSessionIdGetResponse,
} from "@/api/zod.gen";
import { getAccessToken } from "@/features/auth/data/session";
import { toCoachMemberDetailViewModel } from "@/features/coach/data/coach-members-mapper";
import type { CoachMemberDetailViewModel } from "@/features/coach/types";

export const getCoachMemberDetailDto = cache(
  async (memberId: string): Promise<RosterDetail | null> => {
    const token = await getAccessToken();
    if (!token) {
      return null;
    }

    const { data, error, response } =
      await memberDetailApiV1CoachRosterMemberIdGet({
        path: { member_id: memberId },
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
        `Failed to fetch coach member detail (status: ${response?.status ?? "unknown"}): ${
          typeof error === "string" ? error : "Coach member detail service error"
        }`,
      );
    }

    zRosterDetail.parse(data);
    return zMemberDetailApiV1CoachRosterMemberIdGetResponse.parse(data);
  },
);

export const getCoachSessionDetailDto = cache(
  async (sessionId: string): Promise<CoachSessionDetail | null> => {
    const token = await getAccessToken();
    if (!token) {
      return null;
    }

    const { data, error, response } =
      await sessionDetailApiV1CoachSessionsSessionIdGet({
        path: { session_id: sessionId },
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
        `Failed to fetch coach session detail (status: ${response?.status ?? "unknown"}): ${
          typeof error === "string" ? error : "Coach session detail service error"
        }`,
      );
    }

    zCoachSessionDetail.parse(data);
    return zSessionDetailApiV1CoachSessionsSessionIdGetResponse.parse(data);
  },
);

export const getCoachMemberSessionsDto = cache(
  async (
    memberId: string,
    query?: {
      limit?: number;
      cursor?: string | null;
      movementSlug?: "kuda-kuda" | "pukulan" | "tangkisan" | "tendangan" | null;
      processingStatus?: "queued" | "processing" | "completed" | "failed" | null;
      reviewStatus?: "pending" | "needs_revision" | "approved" | null;
    },
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

export const getCoachMemberDetail = cache(
  async (memberId: string): Promise<CoachMemberDetailViewModel | null> => {
    const detail = await getCoachMemberDetailDto(memberId);
    if (!detail) {
      return null;
    }

    if (detail.latestSession !== null) {
      const [sessionDetail, sessions] = await Promise.all([
        getCoachSessionDetailDto(detail.latestSession.session.id),
        getCoachMemberSessionsDto(memberId, { limit: 4 }),
      ]);

      return toCoachMemberDetailViewModel(detail, sessionDetail, sessions);
    }

    const sessions = await getCoachMemberSessionsDto(memberId, { limit: 4 });
    return toCoachMemberDetailViewModel(detail, null, sessions);
  },
);
