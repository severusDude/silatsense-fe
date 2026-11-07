import "server-only";

import { cache } from "react";
import { dashboardApiV1MemberDashboardGet } from "@/api";
import { zDashboardApiV1MemberDashboardGetResponse } from "@/api/zod.gen";
import { getAccessToken as readAccessToken } from "@/features/auth/data/session";
import { toHistorySummaryViewModel } from "@/features/member/data/history-mapper";
import type { HistorySummaryViewModel } from "@/features/member/types";

export const getDashboardSummary = cache(
  async (): Promise<HistorySummaryViewModel | null> => {
    const token = await readAccessToken();
    if (!token) return null;

    const { data, error, response } = await dashboardApiV1MemberDashboardGet({
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      throwOnError: false,
    });

    if (response?.status === 401 || !data || error) {
      return null;
    }

    const validated = zDashboardApiV1MemberDashboardGetResponse.parse(data);
    return toHistorySummaryViewModel(validated);
  },
);
