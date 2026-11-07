import "server-only";

import { cache } from "react";
import {
  overviewApiV1CoachOverviewGet,
  rosterApiV1CoachRosterGet,
  type CoachOverview as CoachOverviewDto,
  type RosterPage,
} from "@/api";
import {
  zOverviewApiV1CoachOverviewGetResponse,
  zRosterApiV1CoachRosterGetResponse,
} from "@/api/zod.gen";
import { getAccessToken } from "@/features/auth/data/session";
import { toCoachDashboardViewModel } from "@/features/coach/data/coach-dashboard-mapper";
import type { CoachDashboardViewModel } from "@/features/coach/types";

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

    return zOverviewApiV1CoachOverviewGetResponse.parse(data);
  },
);

export const getCoachRosterDto = cache(
  async (): Promise<RosterPage | null> => {
    const token = await getAccessToken();
    if (!token) {
      return null;
    }

    const { data, error, response } = await rosterApiV1CoachRosterGet({
      query: { limit: 5 },
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

    return zRosterApiV1CoachRosterGetResponse.parse(data);
  },
);

export const getCoachDashboard = cache(
  async (): Promise<CoachDashboardViewModel | null> => {
    const [overview, roster] = await Promise.all([
      getCoachOverviewDto(),
      getCoachRosterDto(),
    ]);

    if (!overview) {
      return null;
    }

    return toCoachDashboardViewModel(overview, roster);
  },
);
