"use server";

import "server-only";

import { revalidatePath } from "next/cache";
import { taskApiV1MemberFollowUpTasksTaskIdPatch } from "@/api";
import type { TaskOut } from "@/api";
import { zTaskApiV1MemberFollowUpTasksTaskIdPatchResponse } from "@/api/zod.gen";
import { getAccessToken } from "@/features/auth/data/session";
import {
  updateFollowUpTaskInputSchema,
  zTaskApiV1MemberFollowUpTasksTaskIdPatchData,
} from "@/features/member/schemas/history";
import {
  invalidInputFailure,
  toSessionActionError,
} from "@/features/member/session-action-errors";
import type { ActionResult } from "@/features/member/types";

export async function updateFollowUpTaskAction(
  input: unknown,
): Promise<ActionResult<TaskOut>> {
  const parsed = updateFollowUpTaskInputSchema.safeParse(input);
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

  const patchData = zTaskApiV1MemberFollowUpTasksTaskIdPatchData.parse({
    path: { task_id: parsed.data.taskId },
    body: { status: parsed.data.status },
  });

  const { data, error, response } =
    await taskApiV1MemberFollowUpTasksTaskIdPatch({
      path: patchData.path,
      body: patchData.body,
      headers: { Authorization: `Bearer ${token}` },
      throwOnError: false,
    });

  if (error || !data) {
    return { ok: false, error: toSessionActionError(error, response) };
  }

  const validated = zTaskApiV1MemberFollowUpTasksTaskIdPatchResponse.parse(data);

  revalidatePath("/dashboard");
  revalidatePath("/riwayat");
  revalidatePath(`/riwayat/${parsed.data.sessionId}`);

  return { ok: true, data: validated };
}
