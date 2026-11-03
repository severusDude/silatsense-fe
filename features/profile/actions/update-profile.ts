"use server";

import "server-only";

import { updateMemberProfileApiV1MemberProfilePatch } from "@/api";
import type { ProfileOut } from "@/api";
import { getAccessToken } from "@/features/auth/data/session";
import { updateProfileSchema } from "@/features/profile/schemas";
import type { ActionResult } from "@/features/profile/types";
import { normalizeApiError } from "@/lib/api-client";

export async function updateProfileAction(
  input: unknown
): Promise<ActionResult<ProfileOut>> {
  const parsed = updateProfileSchema.safeParse(input);
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

  const resolvedName = (parsed.data.name ?? parsed.data.fullName)?.trim();

  const { data, error, response } =
    await updateMemberProfileApiV1MemberProfilePatch({
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: {
        fullName: resolvedName ?? null,
        ...(parsed.data.division !== undefined
          ? { division: parsed.data.division }
          : {}),
      },
      throwOnError: false,
    });

  if (error || !data) {
    return {
      ok: false,
      error: normalizeApiError(error, response),
    };
  }

  return {
    ok: true,
    data,
  };
}

export const updateProfile = updateProfileAction;
