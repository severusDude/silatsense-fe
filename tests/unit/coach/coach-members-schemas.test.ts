import { describe, expect, it } from "vitest";
import {
  coachMemberListQuerySchema,
  coachMemberHistoryQuerySchema,
  saveFeedbackDraftInputSchema,
  publishReviewInputSchema,
  coachSessionIdSchema,
} from "@/features/coach/schemas";

describe("coachMemberListQuerySchema", () => {
  it("sanitizes valid and default queries", () => {
    expect(coachMemberListQuerySchema.parse({})).toEqual({
      q: "",
      cursor: null,
      limit: 20,
    });

    expect(
      coachMemberListQuerySchema.parse({
        q: " Ahmad ",
        cursor: "cursor-123",
        limit: "15",
      }),
    ).toEqual({
      q: "Ahmad",
      cursor: "cursor-123",
      limit: 15,
    });
  });

  it("clamps or catches invalid query values with defaults", () => {
    expect(
      coachMemberListQuerySchema.parse({
        q: "a".repeat(200), // > 120 chars fails and catches default ""
        limit: 500, // > 100 catches default 20
        cursor: "", // min 1 catches null
      }),
    ).toEqual({
      q: "",
      cursor: null,
      limit: 20,
    });

    expect(
      coachMemberListQuerySchema.parse({
        limit: -5,
      }),
    ).toEqual({
      q: "",
      cursor: null,
      limit: 20,
    });
  });
});

describe("coachMemberHistoryQuerySchema", () => {
  it("parses valid queries with default limit 10", () => {
    expect(coachMemberHistoryQuerySchema.parse({})).toEqual({
      cursor: null,
      limit: 10,
      movementSlug: null,
      reviewStatus: null,
      processingStatus: null,
    });

    expect(
      coachMemberHistoryQuerySchema.parse({
        cursor: "cur-1",
        limit: "25",
        movementSlug: "pukulan",
        reviewStatus: "approved",
        processingStatus: "completed",
      }),
    ).toEqual({
      cursor: "cur-1",
      limit: 25,
      movementSlug: "pukulan",
      reviewStatus: "approved",
      processingStatus: "completed",
    });
  });

  it("falls back to null for invalid filter values", () => {
    expect(
      coachMemberHistoryQuerySchema.parse({
        movementSlug: "invalid-slug",
        reviewStatus: "invalid-status",
        processingStatus: "invalid-proc",
        limit: 999,
      }),
    ).toEqual({
      cursor: null,
      limit: 10,
      movementSlug: null,
      reviewStatus: null,
      processingStatus: null,
    });
  });
});

describe("coachSessionIdSchema", () => {
  it("validates session id constraints", () => {
    expect(coachSessionIdSchema.safeParse("session-123").success).toBe(true);
    expect(coachSessionIdSchema.safeParse("").success).toBe(false);
    expect(coachSessionIdSchema.safeParse("a".repeat(129)).success).toBe(false);
  });
});

describe("saveFeedbackDraftInputSchema", () => {
  it("validates correct feedback draft input", () => {
    const valid = {
      sessionId: "session-1",
      expectedVersion: 0,
      decision: "approved",
      note: "Catatan latihan silat yang sangat mendalam dan rinci.",
    };
    expect(saveFeedbackDraftInputSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts null decision and null note", () => {
    const valid = {
      sessionId: "session-1",
      expectedVersion: 1,
      decision: null,
      note: null,
    };
    expect(saveFeedbackDraftInputSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects note shorter than 10 characters", () => {
    const invalid = {
      sessionId: "session-1",
      expectedVersion: 0,
      decision: "needs_revision",
      note: "Pendek",
    };
    const res = saveFeedbackDraftInputSchema.safeParse(invalid);
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues[0]?.message).toBe("Catatan minimal 10 karakter");
    }
  });

  it("rejects negative expectedVersion", () => {
    const invalid = {
      sessionId: "session-1",
      expectedVersion: -1,
      decision: "approved",
      note: "Catatan latihan yang valid di sini.",
    };
    expect(saveFeedbackDraftInputSchema.safeParse(invalid).success).toBe(false);
  });
});

describe("publishReviewInputSchema", () => {
  it("validates correct publish input", () => {
    const valid = {
      sessionId: "session-1",
      expectedRevision: 0,
      expectedDraftVersion: 1,
      idempotencyKey: "idem-key-12345",
    };
    expect(publishReviewInputSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects expectedDraftVersion < 1", () => {
    const invalid = {
      sessionId: "session-1",
      expectedRevision: 0,
      expectedDraftVersion: 0,
      idempotencyKey: "idem-key-12345",
    };
    expect(publishReviewInputSchema.safeParse(invalid).success).toBe(false);
  });

  it("rejects empty idempotencyKey", () => {
    const invalid = {
      sessionId: "session-1",
      expectedRevision: 0,
      expectedDraftVersion: 1,
      idempotencyKey: "",
    };
    expect(publishReviewInputSchema.safeParse(invalid).success).toBe(false);
  });
});
