import "server-only";

import { cache } from "react";
import { sessionStatusApiV1MemberSessionsSessionIdGet } from "@/api";
import { getAccessToken } from "@/features/auth/data/session";
import { toSessionViewModel } from "@/features/member/data/session-mapper";
import type { SessionViewModel } from "@/features/member/types";

export const getSession = cache(
  async (sessionId: string): Promise<SessionViewModel | null> => {
    const token = await getAccessToken();
    if (!token) {
      return null;
    }

    const { data, error, response } =
      await sessionStatusApiV1MemberSessionsSessionIdGet({
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
        `Gagal mengambil sesi latihan (status: ${response?.status ?? "unknown"}): ${
          typeof error === "string" ? error : "Layanan sesi bermasalah"
        }`,
      );
    }

    return toSessionViewModel(data);
  },
);
