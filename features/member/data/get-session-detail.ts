import "server-only";

import { cache } from "react";
import { detailApiV1MemberHistorySessionIdGet } from "@/api";
import { zDetailApiV1MemberHistorySessionIdGetResponse } from "@/api/zod.gen";
import { getAccessToken as readAccessToken } from "@/features/auth/data/session";
import { toSessionDetailViewModel } from "@/features/member/data/history-mapper";
import { zDetailApiV1MemberHistorySessionIdGetData } from "@/features/member/schemas/history";
import type { SessionDetailViewModel } from "@/features/member/types";

export const getSessionDetail = cache(
  async (sessionId: string): Promise<SessionDetailViewModel | null> => {
    const token = await readAccessToken();
    if (!token) return null;

    const path = zDetailApiV1MemberHistorySessionIdGetData.shape.path.parse({
      session_id: sessionId,
    });

    const { data, error, response } = await detailApiV1MemberHistorySessionIdGet({
      path,
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      throwOnError: false,
    });

    if (response?.status === 401 || response?.status === 404) {
      return null;
    }

    if (error || !data) {
      throw new Error(
        `Gagal mengambil detail sesi riwayat (status: ${response?.status ?? "unknown"}): ${
          typeof error === "string" ? error : "Layanan riwayat bermasalah"
        }`,
      );
    }

    const validated = zDetailApiV1MemberHistorySessionIdGetResponse.parse(data);
    return toSessionDetailViewModel(validated);
  },
);
