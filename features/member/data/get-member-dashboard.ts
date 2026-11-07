import "server-only";

import { cache } from "react";
import { dashboardApiV1MemberDashboardGet, type Dashboard } from "@/api";
import { zDashboardApiV1MemberDashboardGetResponse } from "@/api/zod.gen";
import {
  getAccessToken as readAccessToken,
  getSession,
} from "@/features/auth/data/session";
import { toMemberDashboardViewModel } from "@/features/member/data/dashboard-mapper";
import type { MemberDashboardViewModel } from "@/features/member/types";

export const getDashboardDto = cache(async (): Promise<Dashboard | null> => {
  const token = await readAccessToken();
  if (!token) {
    return null;
  }

  const { data, error, response } = await dashboardApiV1MemberDashboardGet({
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
      `Gagal mengambil data dasbor member (status: ${response?.status ?? "unknown"}): ${
        typeof error === "string" ? error : "Layanan dasbor bermasalah"
      }`,
    );
  }

  return zDashboardApiV1MemberDashboardGetResponse.parse(data);
});

export const getMemberDashboard = cache(
  async (): Promise<MemberDashboardViewModel | null> => {
    const [dashboard, user] = await Promise.all([
      getDashboardDto(),
      getSession().catch(() => null),
    ]);

    if (!dashboard) {
      return null;
    }

    return toMemberDashboardViewModel(dashboard, user);
  },
);
