import { describe, expect, it } from "vitest";
import {
  idempotencyKeySchema,
  retrySessionInputSchema,
  sessionIdInputSchema,
  sessionIdSchema,
} from "@/features/member/schemas/recording";

describe("sessionIdSchema", () => {
  it("trims an opaque non-empty id", () => {
    // Arrange + Act + Assert
    expect(sessionIdSchema.parse("  ses-123  ")).toBe("ses-123");
  });

  it("rejects empty and oversized ids", () => {
    // Arrange + Act + Assert
    expect(sessionIdSchema.safeParse("   ").success).toBe(false);
    expect(sessionIdSchema.safeParse("x".repeat(129)).success).toBe(false);
  });

  it("accepts the 128-character boundary", () => {
    // Arrange + Act + Assert
    expect(sessionIdSchema.safeParse("x".repeat(128)).success).toBe(true);
  });
});

describe("idempotencyKeySchema", () => {
  it("requires 1 to 128 characters", () => {
    // Arrange + Act + Assert
    expect(idempotencyKeySchema.safeParse("").success).toBe(false);
    expect(idempotencyKeySchema.safeParse("x".repeat(128)).success).toBe(true);
    expect(idempotencyKeySchema.safeParse("x".repeat(129)).success).toBe(false);
  });
});

describe("session action inputs", () => {
  it("accepts a session id object and strips extra keys", () => {
    // Arrange + Act
    const parsed = sessionIdInputSchema.safeParse({
      sessionId: "ses-1",
      extra: true,
    });

    // Assert
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data).toEqual({ sessionId: "ses-1" });
    }
  });

  it("requires an idempotency key for retry", () => {
    // Arrange + Act + Assert
    expect(
      retrySessionInputSchema.safeParse({ sessionId: "ses-1" }).success,
    ).toBe(false);
    expect(
      retrySessionInputSchema.safeParse({
        sessionId: "ses-1",
        idempotencyKey: "4b5a2d1e-0000-4000-8000-000000000000",
      }).success,
    ).toBe(true);
  });
});
