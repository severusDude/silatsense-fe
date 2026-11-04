import "server-only";

import { cache } from "react";
import { prepApiV1MemberTrainingPrepSlugGet } from "@/api";
import { getAccessToken } from "@/features/auth/data/session";
import { toPersiapanViewModel } from "@/features/member/data/training-mapper";
import type { PersiapanViewModel } from "@/features/member/types";

export const getPersiapan = cache(
  async (slug: string): Promise<PersiapanViewModel | null> => {
    const token = await getAccessToken();
    if (!token) {
      return null;
    }

    const { data, error, response } =
      await prepApiV1MemberTrainingPrepSlugGet({
        path: { slug },
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
        `Gagal mengambil persiapan latihan (status: ${response?.status ?? "unknown"}): ${
          typeof error === "string" ? error : "Layanan latihan bermasalah"
        }`,
      );
    }

    return toPersiapanViewModel(data);
  },
);
