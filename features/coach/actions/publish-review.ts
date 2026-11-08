"use server";

import "server-only";

import { revalidatePath } from "next/cache";
import {
  publishApiV1CoachSessionsSessionIdReviewsPost,
  type PublishedReview,
} from "@/api";
import {
  zPublishApiV1CoachSessionsSessionIdReviewsPostResponse,
} from "@/api/zod.gen";
import { getAccessToken } from "@/features/auth/data/session";
import { publishReviewInputSchema } from "@/features/coach/schemas";
import {
  invalidInputFailure,
  toCoachActionError,
} from "@/features/coach/actions/coach-action-errors";
import type { ActionResult } from "@/features/member/types";

export async function publishReviewAction(
  input: unknown,
): Promise<ActionResult<PublishedReview>> {
  const parsed = publishReviewInputSchema.safeParse(input);
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
    await publishApiV1CoachSessionsSessionIdReviewsPost({
      path: { session_id: parsed.data.sessionId },
      headers: {
        Authorization: `Bearer ${token}`,
        "Idempotency-Key": parsed.data.idempotencyKey,
      },
      body: {
        expectedRevision: parsed.data.expectedRevision,
        expectedDraftVersion: parsed.data.expectedDraftVersion,
      },
      // The generated request validator receives a `Headers` instance but its
      // schema reads `Idempotency-Key` as a plain-object property, so it always
      // reports the header as missing. The input is already Zod-validated
      // above, and the response validator stays active.
      requestValidator: undefined,
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
    zPublishApiV1CoachSessionsSessionIdReviewsPostResponse.parse(data);

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
