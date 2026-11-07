"use server";

import "server-only";

import { revalidatePath } from "next/cache";
import { removeSessionApiV1MemberSessionsSessionIdDelete } from "@/api";
import { getAccessToken } from "@/features/auth/data/session";
import { sessionIdInputSchema } from "@/features/member/schemas/recording";
import {
  invalidInputFailure,
  toSessionActionError,
} from "@/features/member/session-action-errors";
import type { ActionResult } from "@/features/member/types";

export async function deleteSessionAction(
  input: unknown,
): Promise<ActionResult<{ sessionId: string }>> {
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

  const { error, response } =
    await removeSessionApiV1MemberSessionsSessionIdDelete({
      path: { session_id: parsed.data.sessionId },
      headers: { Authorization: `Bearer ${token}` },
      throwOnError: false,
    });

  // DELETE returns 204 with no body, so the HTTP response is the success signal.
  if (error || !response?.ok) {
    return { ok: false, error: toSessionActionError(error, response) };
  }

  revalidatePath("/dashboard");
  revalidatePath("/riwayat");

  return { ok: true, data: { sessionId: parsed.data.sessionId } };
}
