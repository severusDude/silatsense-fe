import "server-only";

import { cache } from "react";
import {
  overviewApiV1CoachOverviewGet,
  rosterApiV1CoachRosterGet,
  type CoachOverview as CoachOverviewDto,
  type RosterPage,
} from "@/api";
import {
  zCoachOverview,
  zOverviewApiV1CoachOverviewGetResponse,
  zRosterPage,
  zRosterApiV1CoachRosterGetResponse,
} from "@/api/zod.gen";
import { getAccessToken } from "@/features/auth/data/session";
import { toCoachMembersPageViewModel } from "@/features/coach/data/coach-members-mapper";
import type { CoachMembersPageViewModel } from "@/features/coach/types";

export const getCoachOverviewDto = cache(
  async (): Promise<CoachOverviewDto | null> => {
    const token = await getAccessToken();
    if (!token) {
      return null;
    }

    const { data, error, response } = await overviewApiV1CoachOverviewGet({
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
      throwOnError: false,
    });

    if (response?.status === 401) {
      return null;
    }

    if (error || !data) {
      throw new Error(
        `Failed to fetch coach overview (status: ${response?.status ?? "unknown"}): ${
          typeof error === "string" ? error : "Coach overview service error"
        }`,
      );
    }

    zCoachOverview.parse(data);
    return zOverviewApiV1CoachOverviewGetResponse.parse(data);
  },
);

export const getCoachRosterDto = cache(
  async (
    params: {
      limit?: number;
      cursor?: string | null;
      q?: string;
    } = {},
  ): Promise<RosterPage | null> => {
    const token = await getAccessToken();
    if (!token) {
      return null;
    }

    const limit = Math.max(1, Math.min(100, params.limit ?? 20));
    const q = params.q ? params.q.slice(0, 120) : undefined;
    const cursor = params.cursor ?? undefined;

    const { data, error, response } = await rosterApiV1CoachRosterGet({
      query: {
        limit,
        cursor,
        q,
      },
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
      throwOnError: false,
    });

    if (response?.status === 401) {
      return null;
    }

    if (error || !data) {
      throw new Error(
        `Failed to fetch coach roster (status: ${response?.status ?? "unknown"}): ${
          typeof error === "string" ? error : "Coach roster service error"
        }`,
      );
    }

    zRosterPage.parse(data);
    return zRosterApiV1CoachRosterGetResponse.parse(data);
  },
);

export const getCoachMembersPage = cache(
  async (
    params: {
      q?: string;
      cursor?: string | null;
      limit?: number;
    } = {},
  ): Promise<CoachMembersPageViewModel | null> => {
    const [overview, roster] = await Promise.all([
      getCoachOverviewDto(),
      getCoachRosterDto(params),
    ]);

    if (!overview) {
      return null;
    }

    return toCoachMembersPageViewModel(overview, roster, params.q ?? "");
  },
);
