import { z } from "zod";
import {
  zDraftInput,
  zPublishInput,
  zMemberSessionsApiV1CoachRosterMemberIdSessionsGetQuery,
} from "@/api/zod.gen";

export const coachMemberListQuerySchema = z.object({
  q: z.string().trim().max(120).catch("").default(""),
  cursor: z.string().trim().min(1).max(4096).nullable().catch(null).default(null),
  limit: z.coerce.number().int().min(1).max(100).catch(20).default(20),
});

export const coachMemberHistoryQuerySchema = z.object({
  cursor: z.string().trim().min(1).max(4096).nullable().catch(null).default(null),
  limit: z.coerce.number().int().min(1).max(100).catch(10).default(10),
  movementSlug: zMemberSessionsApiV1CoachRosterMemberIdSessionsGetQuery.shape.movementSlug
    .unwrap()
    .unwrap()
    .nullable()
    .catch(null)
    .default(null),
  reviewStatus: zMemberSessionsApiV1CoachRosterMemberIdSessionsGetQuery.shape.reviewStatus
    .unwrap()
    .unwrap()
    .nullable()
    .catch(null)
    .default(null),
  processingStatus: zMemberSessionsApiV1CoachRosterMemberIdSessionsGetQuery.shape.processingStatus
    .unwrap()
    .unwrap()
    .nullable()
    .catch(null)
    .default(null),
});

export const coachSessionIdSchema = z.string().trim().min(1).max(128);

export const saveFeedbackDraftInputSchema = z.object({
  sessionId: coachSessionIdSchema,
  memberId: z.string().trim().optional(),
  expectedVersion: zDraftInput.shape.expectedVersion,
  decision: zDraftInput.shape.decision,
  note: z.string().trim().min(10, "Catatan minimal 10 karakter").max(5000).nullable(),
});

export const publishReviewInputSchema = z.object({
  sessionId: coachSessionIdSchema,
  memberId: z.string().trim().optional(),
  expectedRevision: zPublishInput.shape.expectedRevision,
  expectedDraftVersion: zPublishInput.shape.expectedDraftVersion,
  idempotencyKey: z.string().trim().min(1).max(128),
});

export type CoachMemberListQuery = z.infer<typeof coachMemberListQuerySchema>;
export type CoachMemberHistoryQuery = z.infer<typeof coachMemberHistoryQuerySchema>;
export type SaveFeedbackDraftInput = z.infer<typeof saveFeedbackDraftInputSchema>;
export type PublishReviewInput = z.infer<typeof publishReviewInputSchema>;
