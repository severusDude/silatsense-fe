import "server-only";

import { cache } from "react";
import {
  prepApiV1MemberTrainingPrepSlugGet,
  recordConfigApiV1MemberRecordConfigSlugGet,
} from "@/api";
import { getAccessToken } from "@/features/auth/data/session";
import { toRekamViewModel } from "@/features/member/data/training-mapper";
import type { RekamViewModel } from "@/features/member/types";

export const getRekam = cache(
  async (slug: string): Promise<RekamViewModel | null> => {
    const token = await getAccessToken();
    if (!token) {
      return null;
    }

    const [configResult, prepResult] = await Promise.all([
      recordConfigApiV1MemberRecordConfigSlugGet({
        path: { slug },
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
        throwOnError: false,
      }),
      prepApiV1MemberTrainingPrepSlugGet({
        path: { slug },
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
        throwOnError: false,
      }),
    ]);

    const statuses = [
      configResult.response?.status,
      prepResult.response?.status,
    ];
    if (statuses.some((status) => status === 401 || status === 404)) {
      return null;
    }

    const failure = configResult.error ?? prepResult.error;
    if (failure || !configResult.data || !prepResult.data) {
      const status = configResult.error
        ? configResult.response?.status
        : prepResult.response?.status;
      throw new Error(
        `Gagal mengambil konfigurasi rekaman (status: ${status ?? "unknown"}): ${
          typeof failure === "string" ? failure : "Layanan rekaman bermasalah"
        }`,
      );
    }

    return toRekamViewModel(configResult.data, prepResult.data);
  },
);
