"use server";

import "server-only";

import { revalidatePath } from "next/cache";
import {
  draftApiV1CoachSessionsSessionIdFeedbackDraftPut,
  type DraftOut,
} from "@/api";
import {
  zDraftApiV1CoachSessionsSessionIdFeedbackDraftPutResponse,
} from "@/api/zod.gen";
import { getAccessToken } from "@/features/auth/data/session";
import { saveFeedbackDraftInputSchema } from "@/features/coach/schemas";
import {
  invalidInputFailure,
  toCoachActionError,
} from "@/features/coach/actions/coach-action-errors";
import type { ActionResult } from "@/features/member/types";

export async function saveFeedbackDraftAction(
  input: unknown,
): Promise<ActionResult<DraftOut>> {
  const parsed = saveFeedbackDraftInputSchema.safeParse(input);
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
    await draftApiV1CoachSessionsSessionIdFeedbackDraftPut({
      path: { session_id: parsed.data.sessionId },
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: {
        expectedVersion: parsed.data.expectedVersion,
        decision: parsed.data.decision,
        note: parsed.data.note,
      },
      cache: "no-store",
      throwOnError: false,
    });

  if (response?.status === 401) {
    return {
      ok: false,
      error: {
        message: "Sesi berakhir. Silakan masuk kembali.",
        code: "UNAUTHORIZED",
      },
    };
  }

  if (error || !data) {
    return {
      ok: false,
      error: toCoachActionError(error, response),
    };
  }

  const validated =
    zDraftApiV1CoachSessionsSessionIdFeedbackDraftPutResponse.parse(data);

  revalidatePath("/coach/members");
  if (parsed.data.memberId) {
    revalidatePath(`/coach/members/${parsed.data.memberId}`);
    revalidatePath(`/coach/members/${parsed.data.memberId}/riwayat`);
  }

  return {
    ok: true,
    data: validated,
  };
}
