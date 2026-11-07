import "server-only";

import { cache } from "react";
import { getDashboardDto } from "@/features/member/data/get-member-dashboard";
import { toHistorySummaryViewModel } from "@/features/member/data/history-mapper";
import type { HistorySummaryViewModel } from "@/features/member/types";

export const getDashboardSummary = cache(
  async (): Promise<HistorySummaryViewModel | null> => {
    const dashboard = await getDashboardDto();
    if (!dashboard) {
      return null;
    }

    return toHistorySummaryViewModel(dashboard);
  },
);
