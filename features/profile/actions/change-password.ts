"use server";

import "server-only";

import {
  coachPasswordApiV1CoachPasswordPatch,
  memberPasswordApiV1MemberPasswordPatch,
} from "@/api";
import { getAccessToken } from "@/features/auth/data/session";
import { passwordChangeFormSchema } from "@/features/profile/schemas";
import type { ActionResult, ProfileRole } from "@/features/profile/types";
import { normalizeApiError } from "@/lib/api-client";

export async function changePasswordAction(
  input: unknown,
  role: ProfileRole = "member"
): Promise<ActionResult<{ success: true }>> {
  const parsed = passwordChangeFormSchema.safeParse(input);
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

  const token = await getAccessToken();
  if (!token) {
    return {
      ok: false,
      error: {
        message: "Sesi tidak ditemukan. Silakan masuk kembali.",
        code: "UNAUTHORIZED",
      },
    };
  }

  const patchFn =
    role === "coach"
      ? coachPasswordApiV1CoachPasswordPatch
      : memberPasswordApiV1MemberPasswordPatch;

  const { error, response } = await patchFn({
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: {
      currentPassword: parsed.data.currentPassword,
      newPassword: parsed.data.newPassword,
    },
    throwOnError: false,
  });

  if (error || (response && response.status >= 400)) {
    return {
      ok: false,
      error: normalizeApiError(error, response),
    };
  }

  return {
    ok: true,
    data: { success: true },
  };
}
