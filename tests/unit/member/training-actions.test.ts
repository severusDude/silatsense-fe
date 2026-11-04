import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  acknowledgeSessionApiV1MemberSessionsSessionIdAcknowledgePost,
  removeSessionApiV1MemberSessionsSessionIdDelete,
  retryApiV1MemberSessionsSessionIdFollowUpsPost,
} from "@/api";
import { getAccessToken } from "@/features/auth/data/session";
import { acknowledgeSessionAction } from "@/features/member/actions/acknowledge-session";
import { deleteSessionAction } from "@/features/member/actions/delete-session";
import { retrySessionAction } from "@/features/member/actions/retry-session";
import { retryRecordingHref } from "@/features/member/retry";
import {
  invalidInputFailure,
  toSessionActionError,
} from "@/features/member/session-action-errors";
import { sessionIdInputSchema } from "@/features/member/schemas/recording";

vi.mock("@/api", () => ({
  acknowledgeSessionApiV1MemberSessionsSessionIdAcknowledgePost: vi.fn(),
  removeSessionApiV1MemberSessionsSessionIdDelete: vi.fn(),
  retryApiV1MemberSessionsSessionIdFollowUpsPost: vi.fn(),
}));

vi.mock("@/features/auth/data/session", () => ({
  getAccessToken: vi.fn(),
}));

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

describe("invalidInputFailure", () => {
  it("turns the first Zod issue into a field-scoped validation failure", () => {
    // Arrange
    const parsed = sessionIdInputSchema.safeParse({});

    // Act
    if (parsed.success) throw new Error("fixture must fail");
    const failure = invalidInputFailure(parsed.error);

    // Assert
    expect(failure.ok).toBe(false);
    expect(failure.error.code).toBe("VALIDATION_ERROR");
    expect(failure.error.fieldErrors?.sessionId).toBeTruthy();
    expect(failure.error.message).toBe(
      failure.error.fieldErrors?.sessionId,
    );
  });
});

describe("toSessionActionError", () => {
  it("prefers the domain detail over the status fallback", () => {
    // Arrange + Act
    const error = toSessionActionError(
      { detail: "Sesi sedang dianalisis.", code: "conflict" },
      new Response(null, { status: 409 }),
    );

    // Assert
    expect(error.message).toBe("Sesi sedang dianalisis.");
    expect(error.code).toBe("conflict");
  });

  it("falls back to member-facing copy for a bare status", () => {
    // Arrange + Act
    const forbidden = toSessionActionError(
      { detail: "" },
      new Response(null, { status: 403 }),
    );
    const missing = toSessionActionError(
      { detail: "" },
      new Response(null, { status: 404 }),
    );

    // Assert
    expect(forbidden.message).toBe("Kamu tidak memiliki akses ke sesi ini.");
    expect(missing.message).toBe("Sesi tidak ditemukan.");
  });

  it("maps rate limiting and offline failures without a status", () => {
    // Arrange + Act
    const limited = toSessionActionError(
      null,
      new Response(null, { status: 429 }),
    );
    const offline = toSessionActionError(null);

    // Assert
    expect(limited.code).toBe("RATE_LIMITED");
    expect(limited.message).toBe("Terlalu banyak percobaan. Coba lagi sebentar.");
    expect(offline.message).toBe(
      "Tidak dapat terhubung ke server. Periksa koneksi lalu coba lagi.",
    );
  });

  it("keeps FastAPI validation details intact", () => {
    // Arrange + Act
    const error = toSessionActionError(
      { detail: [{ loc: ["body", "intent"], msg: "Nilai tidak dikenal" }] },
      new Response(null, { status: 422 }),
    );

    // Assert
    expect(error.code).toBe("VALIDATION_ERROR");
    expect(error.fieldErrors?.intent).toBe("Nilai tidak dikenal");
  });
});

describe("retryRecordingHref", () => {
  it("pins retryOf to the source session, not the follow-up id", () => {
    // Arrange
    const followUp = {
      id: "follow-up-9",
      sourceSessionId: "ses 1",
      createdAt: "2026-11-04T02:00:00.000Z",
    };

    // Act
    const href = retryRecordingHref("pukulan", followUp);

    // Assert
    expect(href).toBe("/latihan/pukulan/rekam?retryOf=ses%201");
    expect(href).not.toContain("follow-up-9");
  });
});

describe("acknowledgeSessionAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects malformed input before reading the token or network", async () => {
    // Arrange + Act
    const result = await acknowledgeSessionAction({});

    // Assert
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("VALIDATION_ERROR");
    }
    expect(getAccessToken).not.toHaveBeenCalled();
    expect(
      acknowledgeSessionApiV1MemberSessionsSessionIdAcknowledgePost,
    ).not.toHaveBeenCalled();
  });

  it("returns UNAUTHORIZED when the access token is missing", async () => {
    // Arrange
    vi.mocked(getAccessToken).mockResolvedValue(undefined);

    // Act
    const result = await acknowledgeSessionAction({ sessionId: "ses-1" });

    // Assert
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("UNAUTHORIZED");
    }
    expect(
      acknowledgeSessionApiV1MemberSessionsSessionIdAcknowledgePost,
    ).not.toHaveBeenCalled();
  });

  it("posts the acknowledge request and returns the timestamp", async () => {
    // Arrange
    vi.mocked(getAccessToken).mockResolvedValue("mock-jwt-token");
    vi.mocked(
      acknowledgeSessionApiV1MemberSessionsSessionIdAcknowledgePost,
    ).mockResolvedValue({
      data: { acknowledgedAt: "2026-11-04T03:15:00.000Z" },
      error: undefined,
      response: new Response(null, { status: 200 }),
    });

    // Act
    const result = await acknowledgeSessionAction({ sessionId: "ses-1" });

    // Assert
    expect(
      acknowledgeSessionApiV1MemberSessionsSessionIdAcknowledgePost,
    ).toHaveBeenCalledWith({
      path: { session_id: "ses-1" },
      headers: { Authorization: "Bearer mock-jwt-token" },
      throwOnError: false,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.acknowledgedAt).toBe("2026-11-04T03:15:00.000Z");
    }
  });

  it("surfaces a domain failure instead of a generic status copy", async () => {
    // Arrange
    vi.mocked(getAccessToken).mockResolvedValue("mock-jwt-token");
    vi.mocked(
      acknowledgeSessionApiV1MemberSessionsSessionIdAcknowledgePost,
    ).mockResolvedValue({
      data: undefined,
      error: { detail: "Evaluasi belum siap.", code: "conflict", requestId: "req-1" },
      response: new Response(null, { status: 409 }),
    });

    // Act
    const result = await acknowledgeSessionAction({ sessionId: "ses-1" });

    // Assert
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toBe("Evaluasi belum siap.");
      expect(result.error.code).toBe("conflict");
    }
  });
});

describe("deleteSessionAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects malformed input before reading the token or network", async () => {
    // Arrange + Act
    const result = await deleteSessionAction({ sessionId: "   " });

    // Assert
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("VALIDATION_ERROR");
    }
    expect(removeSessionApiV1MemberSessionsSessionIdDelete).not.toHaveBeenCalled();
  });

  it("returns UNAUTHORIZED when the access token is missing", async () => {
    // Arrange
    vi.mocked(getAccessToken).mockResolvedValue(undefined);

    // Act
    const result = await deleteSessionAction({ sessionId: "ses-1" });

    // Assert
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("UNAUTHORIZED");
    }
    expect(removeSessionApiV1MemberSessionsSessionIdDelete).not.toHaveBeenCalled();
  });

  it("treats a 204 response as success because the body is empty", async () => {
    // Arrange
    vi.mocked(getAccessToken).mockResolvedValue("mock-jwt-token");
    vi.mocked(removeSessionApiV1MemberSessionsSessionIdDelete).mockResolvedValue({
      data: undefined,
      error: undefined,
      response: new Response(null, { status: 204 }),
    });

    // Act
    const result = await deleteSessionAction({ sessionId: "ses-1" });

    // Assert
    expect(removeSessionApiV1MemberSessionsSessionIdDelete).toHaveBeenCalledWith({
      path: { session_id: "ses-1" },
      headers: { Authorization: "Bearer mock-jwt-token" },
      throwOnError: false,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual({ sessionId: "ses-1" });
    }
  });

  it("fails when the response is not ok even without an error body", async () => {
    // Arrange
    vi.mocked(getAccessToken).mockResolvedValue("mock-jwt-token");
    vi.mocked(removeSessionApiV1MemberSessionsSessionIdDelete).mockResolvedValue({
      data: undefined,
      error: undefined,
      response: new Response(null, { status: 500 }),
    });

    // Act
    const result = await deleteSessionAction({ sessionId: "ses-1" });

    // Assert
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toBe(
        "Layanan latihan sedang bermasalah. Coba lagi beberapa saat.",
      );
    }
  });
});

describe("retrySessionAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requires an idempotency key before touching the network", async () => {
    // Arrange + Act
    const result = await retrySessionAction({ sessionId: "ses-1" });

    // Assert
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("VALIDATION_ERROR");
      expect(result.error.fieldErrors?.idempotencyKey).toBeTruthy();
    }
    expect(
      retryApiV1MemberSessionsSessionIdFollowUpsPost,
    ).not.toHaveBeenCalled();
  });

  it("returns UNAUTHORIZED when the access token is missing", async () => {
    // Arrange
    vi.mocked(getAccessToken).mockResolvedValue(undefined);

    // Act
    const result = await retrySessionAction({
      sessionId: "ses-1",
      idempotencyKey: "key-1",
    });

    // Assert
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("UNAUTHORIZED");
    }
    expect(
      retryApiV1MemberSessionsSessionIdFollowUpsPost,
    ).not.toHaveBeenCalled();
  });

  it("posts the retry intent with the idempotency key and returns the follow-up", async () => {
    // Arrange
    vi.mocked(getAccessToken).mockResolvedValue("mock-jwt-token");
    vi.mocked(
      retryApiV1MemberSessionsSessionIdFollowUpsPost,
    ).mockResolvedValue({
      data: {
        id: "follow-up-9",
        sourceSessionId: "ses-1",
        createdAt: "2026-11-04T02:00:00.000Z",
      },
      error: undefined,
      response: new Response(null, { status: 201 }),
    });

    // Act
    const result = await retrySessionAction({
      sessionId: "ses-1",
      idempotencyKey: "key-1",
    });

    // Assert
    expect(
      retryApiV1MemberSessionsSessionIdFollowUpsPost,
    ).toHaveBeenCalledWith({
      path: { session_id: "ses-1" },
      headers: {
        Authorization: "Bearer mock-jwt-token",
        "Idempotency-Key": "key-1",
      },
      body: { intent: "retry" },
      requestValidator: undefined,
      throwOnError: false,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.sourceSessionId).toBe("ses-1");
    }
  });

  it("surfaces a domain failure from the follow-up endpoint", async () => {
    // Arrange
    vi.mocked(getAccessToken).mockResolvedValue("mock-jwt-token");
    vi.mocked(
      retryApiV1MemberSessionsSessionIdFollowUpsPost,
    ).mockResolvedValue({
      data: undefined,
      error: {
        detail: "Sesi sumber masih diproses.",
        code: "conflict",
        requestId: "req-2",
      },
      response: new Response(null, { status: 409 }),
    });

    // Act
    const result = await retrySessionAction({
      sessionId: "ses-1",
      idempotencyKey: "key-1",
    });

    // Assert
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toBe("Sesi sumber masih diproses.");
    }
  });
});

describe("session action contracts", () => {
  it.each([
    "features/member/actions/acknowledge-session.ts",
    "features/member/actions/delete-session.ts",
    "features/member/actions/retry-session.ts",
  ])("%s is a server-only action that validates its boundary", (file) => {
    // Arrange + Act
    const src = read(file);

    // Assert
    expect(src).toContain('"use server"');
    expect(src).toContain('import "server-only"');
    expect(src).toContain("@/features/member/schemas/recording");
    expect(src).toContain("safeParse");
    expect(src).toContain("getAccessToken");
    expect(src).toContain("throwOnError: false");
    expect(src).not.toContain("fetch(");
  });
});
