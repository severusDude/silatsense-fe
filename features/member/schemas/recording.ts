import { z } from "zod";

/**
 * Session IDs are opaque; only non-empty and length can be validated here.
 * The max matches the `Idempotency-Key` bound, not a BE-documented ID size.
 */
export const sessionIdSchema = z.string().trim().min(1).max(128);

export const idempotencyKeySchema = z.string().trim().min(1).max(128);

export const sessionIdInputSchema = z.object({
  sessionId: sessionIdSchema,
});

export const retrySessionInputSchema = z.object({
  sessionId: sessionIdSchema,
  idempotencyKey: idempotencyKeySchema,
});
