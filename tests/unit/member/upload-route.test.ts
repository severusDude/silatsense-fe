import { createHash } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MEMBER_UPLOAD_MAX_BYTES } from "@/lib/upload-limits";

const { getAccessToken } = vi.hoisted(() => ({ getAccessToken: vi.fn() }));

vi.mock("@/features/auth/data/session", () => ({ getAccessToken }));

import { POST } from "@/app/api/member/sessions/route";

const UPLOAD_URL = "http://localhost:3000/api/member/sessions";
const VIDEO_BYTES = new Uint8Array([1, 2, 3]);
const VIDEO_SHA256 = createHash("sha256").update(VIDEO_BYTES).digest("hex");

const UPLOAD_TICKET = {
  uploadId: "upload-1",
  uploadUrl:
    "https://s3.us-west-004.backblazeb2.com/silatsense-media-rizki/member-uploads/upload-1.webm",
  method: "PUT",
  headers: { "Content-Type": "video/webm" },
  expiresAt: "2026-11-04T01:15:00Z",
  completePath: "/api/v1/member/uploads/upload-1/complete",
  acceptedSession: null,
};

const ACCEPTED_SESSION = {
  sessionId: "session-1",
  statusUrl: "/api/v1/member/sessions/session-1",
  evaluationUrl: "/api/v1/member/sessions/session-1/evaluation",
  uploadedAt: "2026-11-04T01:00:00Z",
};

function uploadRequest({
  idempotencyKey = "idempotency-1",
  movementSlug = "kuda-kuda",
  retryOf,
  file = new File([VIDEO_BYTES], "take.webm", {
    type: "video/webm",
  }),
}: {
  idempotencyKey?: string | null;
  movementSlug?: string;
  retryOf?: string;
  file?: File;
} = {}): Request {
  const form = new FormData();
  form.set("movementSlug", movementSlug);
  form.set("video", file);
  if (retryOf !== undefined) {
    form.set("retryOf", retryOf);
  }

  const headers = new Headers();
  if (idempotencyKey !== null) {
    headers.set("Idempotency-Key", idempotencyKey);
  }

  return new Request(UPLOAD_URL, { method: "POST", body: form, headers });
}

function mockThreeStepSuccess(): void {
  fetchMock
    .mockResolvedValueOnce(Response.json(UPLOAD_TICKET, { status: 201 }))
    .mockResolvedValueOnce(new Response(null, { status: 200 }))
    .mockResolvedValueOnce(Response.json(ACCEPTED_SESSION, { status: 202 }));
}

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
  getAccessToken.mockResolvedValue("token-1");
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("POST /api/member/sessions", () => {
  it("rejects an unauthenticated upload before reading the body", async () => {
    // Arrange
    getAccessToken.mockResolvedValue(undefined);

    // Act
    const response = await POST(uploadRequest());

    // Assert
    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({
      code: "UNAUTHORIZED",
      detail: expect.any(String),
      requestId: expect.any(String),
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("requires a non-empty Idempotency-Key within 128 characters", async () => {
    // Arrange + Act
    const missing = await POST(uploadRequest({ idempotencyKey: null }));
    const blank = await POST(uploadRequest({ idempotencyKey: "   " }));
    const tooLong = await POST(
      uploadRequest({ idempotencyKey: "k".repeat(129) }),
    );

    // Assert
    expect(missing.status).toBe(400);
    expect(blank.status).toBe(400);
    expect(tooLong.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects a declared body above the interim deployment cap", async () => {
    // Arrange
    const request = new Request(UPLOAD_URL, {
      method: "POST",
      body: new Uint8Array([1]),
      headers: {
        "Content-Length": String(MEMBER_UPLOAD_MAX_BYTES + 1),
        "Idempotency-Key": "idempotency-1",
      },
    });

    // Act
    const response = await POST(request);

    // Assert
    expect(response.status).toBe(413);
    expect(await response.json()).toMatchObject({
      code: "PAYLOAD_TOO_LARGE",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects a non-multipart body with a domain error", async () => {
    // Arrange
    const request = new Request(UPLOAD_URL, {
      method: "POST",
      body: JSON.stringify({ movementSlug: "kuda-kuda" }),
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": "idempotency-1",
      },
    });

    // Act
    const response = await POST(request);

    // Assert
    expect(response.status).toBe(415);
    expect(await response.json()).toMatchObject({
      code: "UNSUPPORTED_MEDIA_TYPE",
    });
  });

  it("rejects a form without a video file", async () => {
    // Arrange
    const form = new FormData();
    form.set("movementSlug", "kuda-kuda");
    const request = new Request(UPLOAD_URL, {
      method: "POST",
      body: form,
      headers: { "Idempotency-Key": "idempotency-1" },
    });

    // Act
    const response = await POST(request);

    // Assert
    expect(response.status).toBe(422);
    expect(await response.json()).toMatchObject({ code: "VALIDATION_ERROR" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects an unsupported video MIME type before calling the backend", async () => {
    // Arrange
    const file = new File([VIDEO_BYTES], "take.avi", {
      type: "video/x-msvideo",
    });

    // Act
    const response = await POST(uploadRequest({ file }));

    // Assert
    expect(response.status).toBe(415);
    expect(await response.json()).toMatchObject({
      code: "UNSUPPORTED_MEDIA_TYPE",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("executes the 3-step upload flow with Bearer auth, SHA-256, and idempotency", async () => {
    // Arrange
    mockThreeStepSuccess();

    // Act
    const response = await POST(
      uploadRequest({ retryOf: "retry-1", movementSlug: "  kuda-kuda  " }),
    );

    // Assert
    expect(response.status).toBe(202);
    expect(await response.json()).toMatchObject({
      sessionId: "session-1",
      processingStatus: "queued",
    });
    expect(fetchMock).toHaveBeenCalledTimes(3);

    const initReq = fetchMock.mock.calls[0]?.[0] as Request;
    expect(initReq.url).toBe(
      "https://silatsense-be.vercel.app/api/v1/member/uploads",
    );
    expect(initReq.method).toBe("POST");
    expect(initReq.headers.get("authorization")).toBe("Bearer token-1");
    expect(initReq.headers.get("idempotency-key")).toBe("idempotency-1");
    expect(await initReq.json()).toEqual({
      movementSlug: "kuda-kuda",
      filename: "take.webm",
      mimeType: "video/webm",
      byteSize: 3,
      sha256: VIDEO_SHA256,
      retryOf: "retry-1",
    });

    const [putUrl, putInit] = fetchMock.mock.calls[1] as [string, RequestInit];
    expect(putUrl).toBe(UPLOAD_TICKET.uploadUrl);
    expect(putInit.method).toBe("PUT");
    expect(putInit.headers).toEqual({ "Content-Type": "video/webm" });
    expect(putInit.body).toEqual(VIDEO_BYTES);

    const completeReq = fetchMock.mock.calls[2]?.[0] as Request;
    expect(completeReq.url).toBe(
      "https://silatsense-be.vercel.app/api/v1/member/uploads/upload-1/complete",
    );
    expect(completeReq.method).toBe("POST");
    expect(completeReq.headers.get("authorization")).toBe("Bearer token-1");
  });

  it("omits retryOf when the form sends it empty", async () => {
    // Arrange
    mockThreeStepSuccess();

    // Act
    await POST(uploadRequest({ retryOf: "" }));

    // Assert
    const initReq = fetchMock.mock.calls[0]?.[0] as Request;
    const forwarded = (await initReq.json()) as Record<string, unknown>;
    expect(forwarded.retryOf).toBeUndefined();
  });

  it("returns 202 immediately when the upload ticket carries an accepted session", async () => {
    // Arrange
    fetchMock.mockResolvedValueOnce(
      Response.json(
        {
          ...UPLOAD_TICKET,
          uploadUrl: null,
          acceptedSession: ACCEPTED_SESSION,
        },
        { status: 201 },
      ),
    );

    // Act
    const response = await POST(uploadRequest());

    // Assert
    expect(response.status).toBe(202);
    expect(await response.json()).toMatchObject({
      sessionId: "session-1",
      processingStatus: "queued",
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("forwards a shaped backend error unchanged", async () => {
    // Arrange
    fetchMock.mockResolvedValue(
      Response.json(
        {
          detail: "Berkas rekaman terlalu besar",
          code: "UPLOAD_TOO_LARGE",
          requestId: "req-be-1",
        },
        { status: 413 },
      ),
    );

    // Act
    const response = await POST(uploadRequest());

    // Assert
    expect(response.status).toBe(413);
    expect(await response.json()).toEqual({
      detail: "Berkas rekaman terlalu besar",
      code: "UPLOAD_TOO_LARGE",
      requestId: "req-be-1",
    });
  });

  it("maps a non-JSON backend failure to a local domain error", async () => {
    // Arrange
    fetchMock.mockResolvedValue(
      new Response("<html>bad gateway</html>", {
        status: 503,
        headers: { "Content-Type": "text/html" },
      }),
    );

    // Act
    const response = await POST(uploadRequest());

    // Assert
    expect(response.status).toBe(503);
    const body = (await response.json()) as { detail: string; code: string };
    expect(body.code).toBe("UPLOAD_FAILED");
    expect(body.detail).toBe("Gagal mengunggah rekaman.");
    expect(body.detail).not.toContain("html");
  });

  it("returns STORAGE_UPLOAD_FAILED when the pre-signed storage PUT fails", async () => {
    // Arrange
    fetchMock
      .mockResolvedValueOnce(Response.json(UPLOAD_TICKET, { status: 201 }))
      .mockResolvedValueOnce(new Response("Forbidden", { status: 403 }));

    // Act
    const response = await POST(uploadRequest());

    // Assert
    expect(response.status).toBe(502);
    expect(await response.json()).toMatchObject({
      code: "STORAGE_UPLOAD_FAILED",
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("rejects an accepted response that does not match the contract", async () => {
    // Arrange
    fetchMock
      .mockResolvedValueOnce(Response.json(UPLOAD_TICKET, { status: 201 }))
      .mockResolvedValueOnce(new Response(null, { status: 200 }))
      .mockResolvedValueOnce(
        Response.json({ sessionId: "session-1" }, { status: 202 }),
      );

    // Act
    const response = await POST(uploadRequest());

    // Assert
    expect(response.status).toBe(502);
    expect(await response.json()).toMatchObject({ code: "SCHEMA_MISMATCH" });
  });

  it("returns an upstream unavailable error when the backend cannot be reached", async () => {
    // Arrange
    fetchMock.mockRejectedValue(new TypeError("fetch failed"));

    // Act
    const response = await POST(uploadRequest());

    // Assert
    expect(response.status).toBe(502);
    expect(await response.json()).toMatchObject({ code: "UPLOAD_FAILED" });
  });
});
