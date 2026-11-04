import "server-only";

import { cache } from "react";
import { modulesApiV1MemberTrainingModulesGet } from "@/api";
import { getAccessToken } from "@/features/auth/data/session";
import { toTrainingCatalogViewModel } from "@/features/member/data/training-mapper";
import type { TrainingCatalogViewModel } from "@/features/member/types";

export const getTrainingCatalog = cache(
  async (): Promise<TrainingCatalogViewModel | null> => {
    const token = await getAccessToken();
    if (!token) {
      return null;
    }

    const { data, error, response } = await modulesApiV1MemberTrainingModulesGet({
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
        `Gagal mengambil katalog latihan (status: ${response?.status ?? "unknown"}): ${
          typeof error === "string" ? error : "Layanan latihan bermasalah"
        }`,
      );
    }

    return toTrainingCatalogViewModel(data);
  },
);
