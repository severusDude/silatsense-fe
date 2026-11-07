"use server";

import "server-only";
import { signUpApiV1AuthSignUpPost } from "@/api";
import { normalizeApiError } from "@/lib/api-client";
import {
  signUpPayloadSchema,
} from "@/features/auth/schemas/sign-up";
import {
  extractCookieValue,
  setSessionCookies,
} from "@/features/auth/data/session-cookies";
import type { ActionResult, AuthSuccessResult } from "@/features/auth/types";

export async function signUpAction(
  input: unknown
): Promise<ActionResult<AuthSuccessResult>> {
  const parsed = signUpPayloadSchema.safeParse(input);
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
        message: parsed.error.issues[0]?.message ?? "Input pendaftaran tidak valid",
        code: "VALIDATION_ERROR",
        fieldErrors,
      },
    };
  }

  const { data, error, response } = await signUpApiV1AuthSignUpPost({
    body: {
      fullName: parsed.data.fullName,
      identifier: parsed.data.identifier,
      password: parsed.data.password,
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
    rememberMe: false,
  });

  return {
    ok: true,
    data: {
      user: data.user,
      redirectTo: "/dashboard",
    },
  };
}
