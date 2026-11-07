import "server-only";

import { cache } from "react";
import { evaluationApiV1MemberSessionsSessionIdEvaluationGet } from "@/api";
import { getAccessToken } from "@/features/auth/data/session";
import { getSession } from "@/features/member/data/get-session";
import { toEvaluationViewModel } from "@/features/member/data/session-mapper";
import type { EvaluationViewModel } from "@/features/member/types";

export const getEvaluation = cache(
  async (sessionId: string): Promise<EvaluationViewModel | null> => {
    const token = await getAccessToken();
    if (!token) {
      return null;
    }

    const { data, error, response } =
      await evaluationApiV1MemberSessionsSessionIdEvaluationGet({
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
        `Gagal mengambil evaluasi sesi (status: ${response?.status ?? "unknown"}): ${
          typeof error === "string" ? error : "Layanan evaluasi bermasalah"
        }`,
      );
    }

    const session = await getSession(sessionId);

    return toEvaluationViewModel(data, session);
  },
);
