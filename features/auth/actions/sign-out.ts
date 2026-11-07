"use server";

import "server-only";
import { logoutApiV1AuthLogoutPost } from "@/api";
import {
  clearSessionCookies,
  getSessionCookies,
} from "@/features/auth/data/session-cookies";
import type { ActionResult } from "@/features/auth/types";

export type SignOutResult = {
  redirectTo: string;
};

export async function signOutAction(): Promise<ActionResult<SignOutResult>> {
  const { accessToken, refreshToken } = await getSessionCookies();

  try {
    if (accessToken || refreshToken) {
      await logoutApiV1AuthLogoutPost({
        headers: {
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          ...(refreshToken ? { Cookie: `refresh_token=${refreshToken}` } : {}),
        },
        throwOnError: false,
      });
    }
  } catch {
    // Best effort logout on BE; always clear FE session cookies
  } finally {
    await clearSessionCookies();
  }

  return {
    ok: true,
    data: {
      redirectTo: "/sign-in",
    },
  };
}
