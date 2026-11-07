import "server-only";

import { cache } from "react";
import {
  coachProfileApiV1CoachProfileGet,
  memberProfileApiV1MemberProfileGet,
} from "@/api";
import { getAccessToken } from "@/features/auth/data/session";
import { toProfileViewModel } from "@/features/profile/data/profile-mapper";
import type { ProfileRole, ProfileViewModel } from "@/features/profile/types";

export const getProfile = cache(
  async (role: ProfileRole = "member"): Promise<ProfileViewModel | null> => {
    const token = await getAccessToken();
    if (!token) {
      return null;
    }

    const fetcher =
      role === "coach"
        ? coachProfileApiV1CoachProfileGet
        : memberProfileApiV1MemberProfileGet;

    const { data, error, response } = await fetcher({
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
        `Gagal mengambil data profil (status: ${response?.status ?? "unknown"}): ${
          typeof error === "string" ? error : "Layanan profil bermasalah"
        }`
      );
    }

    return toProfileViewModel(data);
  }
);
