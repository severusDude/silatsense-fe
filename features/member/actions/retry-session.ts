"use server";

import "server-only";

import { retryApiV1MemberSessionsSessionIdFollowUpsPost } from "@/api";
import type { RetryOut } from "@/api";
import { getAccessToken } from "@/features/auth/data/session";
import { retrySessionInputSchema } from "@/features/member/schemas/recording";
import {
  invalidInputFailure,
  toSessionActionError,
} from "@/features/member/session-action-errors";
import type { ActionResult } from "@/features/member/types";

export async function retrySessionAction(
  input: unknown,
): Promise<ActionResult<RetryOut>> {
  const parsed = retrySessionInputSchema.safeParse(input);
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
    await retryApiV1MemberSessionsSessionIdFollowUpsPost({
      path: { session_id: parsed.data.sessionId },
      headers: {
        Authorization: `Bearer ${token}`,
        "Idempotency-Key": parsed.data.idempotencyKey,
      },
      body: { intent: "retry" },
      // The generated request validator receives a `Headers` instance but its
      // schema reads `Idempotency-Key` as a plain-object property, so it always
      // reports the header as missing. The input is already Zod-validated
      // above, and the response validator stays active.
      requestValidator: undefined,
      throwOnError: false,
    });

  if (error || !data) {
    return { ok: false, error: toSessionActionError(error, response) };
  }

  return { ok: true, data };
}
