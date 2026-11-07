"use server";

import "server-only";

import { revalidatePath } from "next/cache";
import { acknowledgeSessionApiV1MemberSessionsSessionIdAcknowledgePost } from "@/api";
import type { AcknowledgedOut } from "@/api";
import { getAccessToken } from "@/features/auth/data/session";
import { sessionIdInputSchema } from "@/features/member/schemas/recording";
import {
  invalidInputFailure,
  toSessionActionError,
} from "@/features/member/session-action-errors";
import type { ActionResult } from "@/features/member/types";

export async function acknowledgeSessionAction(
  input: unknown,
): Promise<ActionResult<AcknowledgedOut>> {
  const parsed = sessionIdInputSchema.safeParse(input);
  if (!parsed.success) {
    return invalidInputFailure(parsed.error);
  }

  const token = await getAccessToken();
  if (!token) {
    return {
      ok: false,
      error: {
        message: "Sesi berakhir. Silakan masuk kembali.",
        code: "UNAUTHORIZED",
      },
    };
  }

  const { data, error, response } =
    await acknowledgeSessionApiV1MemberSessionsSessionIdAcknowledgePost({
      path: { session_id: parsed.data.sessionId },
      headers: { Authorization: `Bearer ${token}` },
      throwOnError: false,
    });

  if (error || !data) {
    return { ok: false, error: toSessionActionError(error, response) };
  }

  revalidatePath("/dashboard");
  revalidatePath("/riwayat");

  return { ok: true, data };
}
