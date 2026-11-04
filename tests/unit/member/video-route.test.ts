import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { getAccessToken } = vi.hoisted(() => ({ getAccessToken: vi.fn() }));

vi.mock("@/features/auth/data/session", () => ({ getAccessToken }));

import { GET } from "@/app/api/member/sessions/[sessionId]/video/route";

const VIDEO_URL = "http://localhost:3000/api/member/sessions/session-1/video";

function videoRequest(range?: string): Request {
  const headers = new Headers();
  if (range) {
    headers.set("Range", range);
  }
  return new Request(VIDEO_URL, { headers });
}

function videoStream(bytes: number[]): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      controller.enqueue(new Uint8Array(bytes));
      controller.close();
    },
  });
}

function context(sessionId = "session-1") {
  return { params: Promise.resolve({ sessionId }) };
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

describe("GET /api/member/sessions/[sessionId]/video", () => {
  it("rejects an unauthenticated request without calling the backend", async () => {
    // Arrange
    getAccessToken.mockResolvedValue(undefined);

    // Act
    const response = await GET(videoRequest(), context());

    // Assert
    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({ code: "UNAUTHORIZED" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("streams a full video response with media headers", async () => {
    // Arrange
    fetchMock.mockResolvedValue(
      new Response(videoStream([0, 1, 2, 3]), {
        status: 200,
        headers: {
          "Content-Type": "video/webm",
          "Content-Length": "4",
          "Accept-Ranges": "bytes",
        },
      }),
    );

    // Act
    const response = await GET(videoRequest(), context());

    // Assert
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("video/webm");
    expect(response.headers.get("content-length")).toBe("4");
    expect(response.headers.get("accept-ranges")).toBe("bytes");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(
      new Uint8Array([0, 1, 2, 3]),
    );

    const outgoing = fetchMock.mock.calls[0]?.[0] as Request;
    expect(outgoing.url).toBe(
      "https://silatsense-be.vercel.app/api/v1/member/sessions/session-1/video",
    );
    expect(outgoing.headers.get("authorization")).toBe("Bearer token-1");
    expect(outgoing.headers.get("range")).toBeNull();
  });

  it("forwards a Range request and returns 206 with Content-Range", async () => {
    // Arrange
    fetchMock.mockResolvedValue(
      new Response(videoStream([4, 5]), {
        status: 206,
        headers: {
          "Content-Type": "video/mp4",
          "Content-Length": "2",
          "Content-Range": "bytes 4-5/10",
          "Accept-Ranges": "bytes",
        },
      }),
    );

    // Act
    const response = await GET(videoRequest("bytes=4-5"), context());

    // Assert
    expect(response.status).toBe(206);
    expect(response.headers.get("content-range")).toBe("bytes 4-5/10");
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(
      new Uint8Array([4, 5]),
    );

    const outgoing = fetchMock.mock.calls[0]?.[0] as Request;
    expect(outgoing.headers.get("range")).toBe("bytes=4-5");
  });

  it("forwards a shaped backend error", async () => {
    // Arrange
    fetchMock.mockResolvedValue(
      Response.json(
        {
          detail: "Rekaman tidak ditemukan",
          code: "SESSION_NOT_FOUND",
          requestId: "req-be-2",
        },
        { status: 404 },
      ),
    );

    // Act
    const response = await GET(videoRequest(), context());

    // Assert
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      detail: "Rekaman tidak ditemukan",
      code: "SESSION_NOT_FOUND",
      requestId: "req-be-2",
    });
  });

  it("maps an empty 416 response to a range domain error", async () => {
    // Arrange
    fetchMock.mockResolvedValue(new Response(null, { status: 416 }));

    // Act
    const response = await GET(videoRequest("bytes=99-100"), context());

    // Assert
    expect(response.status).toBe(416);
    expect(await response.json()).toMatchObject({
      code: "RANGE_NOT_SATISFIABLE",
    });
  });

  it("returns a local unavailable error when the backend cannot be reached", async () => {
    // Arrange
    fetchMock.mockRejectedValue(new TypeError("fetch failed"));

    // Act
    const response = await GET(videoRequest(), context());

    // Assert
    expect(response.status).toBe(502);
    expect(await response.json()).toMatchObject({ code: "VIDEO_UNAVAILABLE" });
  });
});
