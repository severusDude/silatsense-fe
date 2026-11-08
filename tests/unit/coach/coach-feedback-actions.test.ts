import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const mockDraftPut = vi.fn();
const mockPublishPost = vi.fn();
const mockGetAccessToken = vi.fn();

vi.mock("@/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api")>();
  return {
    ...actual,
    draftApiV1CoachSessionsSessionIdFeedbackDraftPut: (...args: unknown[]) =>
      mockDraftPut(...args),
    publishApiV1CoachSessionsSessionIdReviewsPost: (...args: unknown[]) =>
      mockPublishPost(...args),
  };
});

vi.mock("@/features/auth/data/session", () => ({
  getAccessToken: () => mockGetAccessToken(),
}));

const sampleDraftOut = {
  version: 2,
  author: {
    id: "coach-1",
    fullName: "Coach Budi",
    title: "Pelatih",
  },
  updatedAt: "2026-10-10T12:00:00Z",
  decision: "approved",
  note: "Catatan latihan silat yang sangat rinci.",
  bodyAssessments: [],
  tasks: [],
};

const samplePublishedReview = {
  id: "rev-123",
  revision: 1,
  author: {
    id: "coach-1",
    fullName: "Coach Budi",
    title: "Pelatih",
  },
  publishedAt: "2026-10-10T12:05:00Z",
  decision: "approved",
  note: "Catatan latihan silat yang sangat rinci.",
  bodyAssessments: [],
  taskIds: [],
  supersedesReviewId: null,
};

describe("coach feedback server actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAccessToken.mockResolvedValue("test-token");
  });

  describe("saveFeedbackDraftAction", () => {
    it("returns validation error on invalid input", async () => {
      const { saveFeedbackDraftAction } = await import(
        "@/features/coach/actions/save-feedback-draft"
      );

      const result = await saveFeedbackDraftAction({
        sessionId: "",
        expectedVersion: -1,
        note: "pendek",
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("VALIDATION_FAILED");
      }
    });

    it("returns UNAUTHORIZED if not authenticated", async () => {
      mockGetAccessToken.mockResolvedValueOnce(null);
      const { saveFeedbackDraftAction } = await import(
        "@/features/coach/actions/save-feedback-draft"
      );

      const result = await saveFeedbackDraftAction({
        sessionId: "sess-1",
        expectedVersion: 0,
        decision: "approved",
        note: "Catatan latihan valid minimal 10 karakter.",
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("UNAUTHORIZED");
      }
    });

    it("returns UNAUTHORIZED if API returns 401", async () => {
      mockDraftPut.mockResolvedValueOnce({
        data: null,
        error: "Unauthorized",
        response: new Response(null, { status: 401 }),
      });

      const { saveFeedbackDraftAction } = await import(
        "@/features/coach/actions/save-feedback-draft"
      );

      const result = await saveFeedbackDraftAction({
        sessionId: "sess-1",
        expectedVersion: 0,
        decision: "approved",
        note: "Catatan latihan valid minimal 10 karakter.",
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("UNAUTHORIZED");
      }
    });

    it("handles 409 conflict", async () => {
      mockDraftPut.mockResolvedValueOnce({
        data: null,
        error: "Conflict",
        response: new Response(null, { status: 409 }),
      });

      const { saveFeedbackDraftAction } = await import(
        "@/features/coach/actions/save-feedback-draft"
      );

      const result = await saveFeedbackDraftAction({
        sessionId: "sess-1",
        expectedVersion: 0,
        decision: "approved",
        note: "Catatan latihan valid minimal 10 karakter.",
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("CONFLICT");
        expect(result.error.message).toBe(
          "Ulasan telah berubah. Muat ulang lalu coba lagi.",
        );
      }
    });

    it("saves draft successfully with Authorization header and revalidation", async () => {
      mockDraftPut.mockResolvedValueOnce({
        data: sampleDraftOut,
        error: null,
        response: new Response(null, { status: 200 }),
      });

      const { saveFeedbackDraftAction } = await import(
        "@/features/coach/actions/save-feedback-draft"
      );
      const { revalidatePath } = await import("next/cache");

      const result = await saveFeedbackDraftAction({
        sessionId: "sess-1",
        memberId: "mem-1",
        expectedVersion: 1,
        decision: "approved",
        note: "Catatan latihan silat yang sangat rinci.",
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toEqual(sampleDraftOut);
      }

      expect(mockDraftPut).toHaveBeenCalledWith({
        path: { session_id: "sess-1" },
        headers: { Authorization: "Bearer test-token" },
        body: {
          expectedVersion: 1,
          decision: "approved",
          note: "Catatan latihan silat yang sangat rinci.",
        },
        cache: "no-store",
        throwOnError: false,
      });

      expect(revalidatePath).toHaveBeenCalledWith("/coach/members");
      expect(revalidatePath).toHaveBeenCalledWith("/coach/members/mem-1");
      expect(revalidatePath).toHaveBeenCalledWith("/coach/members/mem-1/riwayat");
    });
  });

  describe("publishReviewAction", () => {
    it("returns validation error on invalid input", async () => {
      const { publishReviewAction } = await import(
        "@/features/coach/actions/publish-review"
      );

      const result = await publishReviewAction({
        sessionId: "",
        expectedRevision: -1,
        expectedDraftVersion: 0,
        idempotencyKey: "",
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("VALIDATION_FAILED");
      }
    });

    it("publishes review with Idempotency-Key and requestValidator: undefined", async () => {
      mockPublishPost.mockResolvedValueOnce({
        data: samplePublishedReview,
        error: null,
        response: new Response(null, { status: 201 }),
      });

      const { publishReviewAction } = await import(
        "@/features/coach/actions/publish-review"
      );
      const { revalidatePath } = await import("next/cache");

      const result = await publishReviewAction({
        sessionId: "sess-1",
        memberId: "mem-1",
        expectedRevision: 0,
        expectedDraftVersion: 2,
        idempotencyKey: "idem-12345",
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toEqual(samplePublishedReview);
      }

      expect(mockPublishPost).toHaveBeenCalledWith({
        path: { session_id: "sess-1" },
        headers: {
          Authorization: "Bearer test-token",
          "Idempotency-Key": "idem-12345",
        },
        body: {
          expectedRevision: 0,
          expectedDraftVersion: 2,
        },
        requestValidator: undefined,
        cache: "no-store",
        throwOnError: false,
      });

      expect(revalidatePath).toHaveBeenCalledWith("/coach/members");
      expect(revalidatePath).toHaveBeenCalledWith("/coach/members/mem-1");
    });

    it("handles 409 conflict on publish", async () => {
      mockPublishPost.mockResolvedValueOnce({
        data: null,
        error: "Conflict",
        response: new Response(null, { status: 409 }),
      });

      const { publishReviewAction } = await import(
        "@/features/coach/actions/publish-review"
      );

      const result = await publishReviewAction({
        sessionId: "sess-1",
        expectedRevision: 0,
        expectedDraftVersion: 1,
        idempotencyKey: "idem-12345",
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("CONFLICT");
      }
    });
  });
});
