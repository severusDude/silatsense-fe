import "server-only";

import { cache } from "react";
import { historyApiV1MemberHistoryGet } from "@/api";
import { zHistoryApiV1MemberHistoryGetResponse } from "@/api/zod.gen";
import { getAccessToken as readAccessToken } from "@/features/auth/data/session";
import { getDashboardSummary } from "@/features/member/data/get-dashboard-summary";
import { toHistoryPageViewModel } from "@/features/member/data/history-mapper";
import {
  historyFilterQuerySchema,
  zHistoryApiV1MemberHistoryGetData,
} from "@/features/member/schemas/history";
import type {
  HistoryFiltersViewModel,
  HistoryPageViewModel,
  HistorySummaryViewModel,
} from "@/features/member/types";

export const getRiwayatSummary = cache(
  async (): Promise<HistorySummaryViewModel | null> => {
    return getDashboardSummary();
  },
);

export const getRiwayatPage = cache(
  async (
    rawFilters?: Partial<HistoryFiltersViewModel>,
  ): Promise<HistoryPageViewModel | null> => {
    const token = await readAccessToken();
    if (!token) return null;

    const parsedFilters = historyFilterQuerySchema.parse(rawFilters ?? {});
    const query = zHistoryApiV1MemberHistoryGetData.shape.query.parse({
      limit: parsedFilters.limit,
      cursor: parsedFilters.cursor ?? undefined,
      movementSlug: parsedFilters.movementSlug ?? undefined,
      reviewStatus: parsedFilters.reviewStatus ?? undefined,
      processingStatus: parsedFilters.processingStatus ?? undefined,
    });

    const { data, error, response } = await historyApiV1MemberHistoryGet({
      query,
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      throwOnError: false,
    });

    if (response?.status === 401) {
      return null;
    }

    if (error || !data) {
      throw new Error(
        `Gagal mengambil riwayat latihan (status: ${response?.status ?? "unknown"}): ${
          typeof error === "string" ? error : "Layanan riwayat bermasalah"
        }`,
      );
    }

    const validated = zHistoryApiV1MemberHistoryGetResponse.parse(data);
    return toHistoryPageViewModel(validated, parsedFilters);
  },
);

export const getRiwayat = getRiwayatPage;
