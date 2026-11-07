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

    const {
      data: configData,
      error: configError,
      response: configResponse,
    } = await recordConfigApiV1MemberRecordConfigSlugGet({
      path: { slug },
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
      throwOnError: false,
    });

    if (configResponse?.status === 401 || configResponse?.status === 404) {
      return null;
    }

    if (configError || !configData) {
      throw new Error(
        `Gagal mengambil konfigurasi rekaman (status: ${configResponse?.status ?? "unknown"}): ${
          typeof configError === "string"
            ? configError
            : "Layanan rekaman bermasalah"
        }`,
      );
    }

    const {
      data: prepData,
      error: prepError,
      response: prepResponse,
    } = await prepApiV1MemberTrainingPrepSlugGet({
      path: { slug },
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
      throwOnError: false,
    });

    if (prepResponse?.status === 401 || prepResponse?.status === 404) {
      return null;
    }

    if (prepError || !prepData) {
      throw new Error(
        `Gagal mengambil konfigurasi rekaman (status: ${prepResponse?.status ?? "unknown"}): ${
          typeof prepError === "string"
            ? prepError
            : "Layanan rekaman bermasalah"
        }`,
      );
    }

    return toRekamViewModel(configData, prepData);
  },
);
