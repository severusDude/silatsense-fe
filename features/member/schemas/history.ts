import { z } from "zod";
import {
  zHistoryApiV1MemberHistoryGetQuery,
  zDetailApiV1MemberHistorySessionIdGetPath,
  zTaskApiV1MemberFollowUpTasksTaskIdPatchPath,
  zTaskPatch,
} from "@/api/zod.gen";
import { sessionIdSchema } from "@/features/member/schemas/recording";

export const zHistoryApiV1MemberHistoryGetData = z.object({
  query: zHistoryApiV1MemberHistoryGetQuery,
});

export const zDetailApiV1MemberHistorySessionIdGetData = z.object({
  path: zDetailApiV1MemberHistorySessionIdGetPath,
});

export const zTaskApiV1MemberFollowUpTasksTaskIdPatchData = z.object({
  path: zTaskApiV1MemberFollowUpTasksTaskIdPatchPath,
  body: zTaskPatch,
});

export const historyMovementSlugSchema = z.enum([
  "kuda-kuda",
  "pukulan",
  "tangkisan",
  "tendangan",
]);

export const historyReviewStatusSchema = z.enum([
  "pending",
  "needs_revision",
  "approved",
]);

export const historyProcessingStatusSchema = z.enum([
  "queued",
  "processing",
  "completed",
  "failed",
]);

export const historyFilterQuerySchema = z.object({
  movementSlug: historyMovementSlugSchema.nullable().catch(null).default(null),
  reviewStatus: historyReviewStatusSchema.nullable().catch(null).default(null),
  processingStatus: historyProcessingStatusSchema.nullable().catch(null).default(null),
  cursor: z.string().trim().min(1).max(4096).nullable().catch(null).default(null),
  limit: z.coerce.number().int().min(1).max(100).catch(20).default(20),
});

export const taskIdSchema = z.string().trim().min(1).max(128);

export const updateFollowUpTaskInputSchema = z.object({
  taskId: taskIdSchema,
  sessionId: sessionIdSchema,
  status: zTaskPatch.shape.status,
});

export type HistoryFilterQueryInput = z.infer<typeof historyFilterQuerySchema>;
export type UpdateFollowUpTaskInput = z.infer<typeof updateFollowUpTaskInputSchema>;
