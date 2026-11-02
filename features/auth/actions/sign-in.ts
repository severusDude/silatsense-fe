"use server";

import "server-only";
import { signInApiV1AuthSignInPost } from "@/api";
import { normalizeApiError } from "@/lib/api-client";
import {
  signInPayloadSchema,
} from "@/features/auth/schemas/sign-in";
import {
  extractCookieValue,
  setSessionCookies,
} from "@/features/auth/data/session-cookies";
import type { ActionResult, AuthSuccessResult } from "@/features/auth/types";

export async function signInAction(
  input: unknown
): Promise<ActionResult<AuthSuccessResult>> {
  const parsed = signInPayloadSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (typeof field === "string") {
        fieldErrors[field] = issue.message;
      }
    }
    return {
      ok: false,
      error: {
        message: parsed.error.issues[0]?.message ?? "Input tidak valid",
        code: "VALIDATION_ERROR",
        fieldErrors,
      },
    };
  }

  const { data, error, response } = await signInApiV1AuthSignInPost({
    body: {
      identifier: parsed.data.identifier,
      password: parsed.data.password,
      rememberMe: parsed.data.rememberMe,
    },
    throwOnError: false,
  });

  if (error || !data) {
    return {
      ok: false,
      error: normalizeApiError(error, response),
    };
  }

  const setCookies = response?.headers.getSetCookie?.() ?? [
    response?.headers.get("set-cookie") ?? "",
  ];
  const refreshToken = extractCookieValue(setCookies, "refresh_token");

  await setSessionCookies({
    accessToken: data.accessToken,
    refreshToken,
    expiresIn: data.expiresIn,
    rememberMe: parsed.data.rememberMe,
  });

  let redirectTo = data.user.role === "coach" ? "/coach" : "/dashboard";
  if (
    parsed.data.next &&
    parsed.data.next.startsWith("/") &&
    !parsed.data.next.startsWith("//")
  ) {
    redirectTo = parsed.data.next;
  }

  return {
    ok: true,
    data: {
      user: data.user,
      redirectTo,
    },
  };
}
