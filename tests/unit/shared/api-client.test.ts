import type { MockInstance } from "vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  BASE_DELAY_MS,
  fetchWithTransientRetry,
  MAX_RETRIES,
  normalizeApiError,
  RETRYABLE_STATUS_CODES,
} from "@/lib/api-client";
import { createClientConfig } from "@/src/hey-api";

describe("normalizeApiError", () => {
  it("normalizes FastAPI 422 validation array into fieldErrors and first message", () => {
    const error = {
      detail: [
        {
          loc: ["body", "identifier"],
          msg: "Value error, Format NPM atau email tidak valid",
          type: "value_error",
        },
        {
          loc: ["body", "password"],
          msg: "String should have at least 8 characters",
          type: "string_too_short",
        },
      ],
    };

    const res = normalizeApiError(error);
    expect(res.message).toBe("Value error, Format NPM atau email tidak valid");
    expect(res.code).toBe("VALIDATION_ERROR");
    expect(res.fieldErrors).toEqual({
      identifier: "Value error, Format NPM atau email tidak valid",
      password: "String should have at least 8 characters",
    });
  });

  it("normalizes domain error string detail", () => {
    const error = { detail: "Kredensial tidak valid" };
    const res = normalizeApiError(error);
    expect(res.message).toBe("Kredensial tidak valid");
    expect(res.fieldErrors).toBeUndefined();
  });

  it("normalizes data domain error with code", () => {
    const error = {
      detail: "Sesi tidak ditemukan",
      code: "SESSION_NOT_FOUND",
      requestId: "req_123",
    };
    const res = normalizeApiError(error);
    expect(res.message).toBe("Sesi tidak ditemukan");
    expect(res.code).toBe("SESSION_NOT_FOUND");
  });

  it("normalizes HTTP 429 rate limit", () => {
    const mockResponse = new Response(null, { status: 429 });
    const res = normalizeApiError(null, mockResponse);
    expect(res.message).toBe("Terlalu banyak percobaan. Coba lagi sebentar.");
    expect(res.code).toBe("RATE_LIMITED");
  });

  it("handles network/unknown error gracefully", () => {
    const res = normalizeApiError(null);
    expect(res.message).toBe("Tidak dapat terhubung ke server");
  });
});

describe("fetchWithTransientRetry", () => {
  let setTimeoutSpy: MockInstance;
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    setTimeoutSpy = vi.spyOn(globalThis, "setTimeout").mockImplementation(((cb: TimerHandler) => {
      if (typeof cb === "function") cb();
      return 1 as unknown as NodeJS.Timeout;
    }) as unknown as typeof setTimeout);
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    setTimeoutSpy.mockRestore();
    vi.restoreAllMocks();
  });

  it("exports retry constants matching specifications", () => {
    expect(RETRYABLE_STATUS_CODES).toEqual(new Set([500, 502, 503, 504]));
    expect(MAX_RETRIES).toBe(2);
    expect(BASE_DELAY_MS).toBe(500);
  });

  it.each([500, 502, 503, 504])(
    "retries a GET request on HTTP %i and returns the subsequent 200 OK response",
    async (transientStatus) => {
      const mockFetch = vi
        .fn<typeof fetch>()
        .mockResolvedValueOnce(new Response(null, { status: transientStatus }))
        .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }));
      globalThis.fetch = mockFetch;

      const response = await fetchWithTransientRetry("https://example.com/api/items");

      expect(response.status).toBe(200);
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(setTimeoutSpy).toHaveBeenCalledTimes(1);
      const delay = setTimeoutSpy.mock.calls[0][1];
      expect(delay).toBeGreaterThanOrEqual(500);
      expect(delay).toBeLessThanOrEqual(600);
    },
  );

  it("retries a HEAD request as idempotent", async () => {
    const mockFetch = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(null, { status: 503 }))
      .mockResolvedValueOnce(new Response(null, { status: 200 }));
    globalThis.fetch = mockFetch;

    const response = await fetchWithTransientRetry("https://example.com/api/health", {
      method: "HEAD",
    });

    expect(response.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("exhausts retries after MAX_RETRIES (3 total attempts) and returns the final 500 response", async () => {
    const mockFetch = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response("error 1", { status: 500 }))
      .mockResolvedValueOnce(new Response("error 2", { status: 500 }))
      .mockResolvedValueOnce(new Response("error 3", { status: 500 }));
    globalThis.fetch = mockFetch;

    const response = await fetchWithTransientRetry("https://example.com/api/items");

    expect(response.status).toBe(500);
    expect(await response.text()).toBe("error 3");
    expect(mockFetch).toHaveBeenCalledTimes(3);
    expect(setTimeoutSpy).toHaveBeenCalledTimes(2);
  });

  it("retries a GET request when fetch rejects with a network TypeError and succeeds on attempt 2", async () => {
    const mockFetch = vi
      .fn<typeof fetch>()
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce(new Response(JSON.stringify({ recovered: true }), { status: 200 }));
    globalThis.fetch = mockFetch;

    const response = await fetchWithTransientRetry("https://example.com/api/network");

    expect(response.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("rethrows after exhausting retries if all attempts reject with network errors", async () => {
    const networkError = new TypeError("Network down");
    const mockFetch = vi.fn<typeof fetch>().mockRejectedValue(networkError);
    globalThis.fetch = mockFetch;

    await expect(fetchWithTransientRetry("https://example.com/api/down")).rejects.toThrow(
      networkError,
    );
    expect(mockFetch).toHaveBeenCalledTimes(3);
    expect(setTimeoutSpy).toHaveBeenCalledTimes(2);
  });

  it("handles Request object inputs and clones correctly across retries", async () => {
    const request = new Request("https://example.com/api/from-request", { method: "GET" });
    const mockFetch = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(null, { status: 502 }))
      .mockResolvedValueOnce(new Response("ok", { status: 200 }));
    globalThis.fetch = mockFetch;

    const response = await fetchWithTransientRetry(request);

    expect(response.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledTimes(2);
    // Request passed to fetch should be cloned, original request remains readable
    const firstCallArg = mockFetch.mock.calls[0][0];
    expect(firstCallArg).toBeInstanceOf(Request);
  });

  it("does NOT retry non-idempotent methods (POST, PUT, PATCH, DELETE) on HTTP 500", async () => {
    const methods = ["POST", "PUT", "PATCH", "DELETE"] as const;

    for (const method of methods) {
      const mockFetch = vi
        .fn<typeof fetch>()
        .mockResolvedValueOnce(new Response(null, { status: 500 }));
      globalThis.fetch = mockFetch;

      const response = await fetchWithTransientRetry("https://example.com/api/mutate", {
        method,
      });

      expect(response.status).toBe(500);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    }
  });

  it("does NOT retry non-idempotent methods on network error (rethrows immediately)", async () => {
    const networkError = new TypeError("Failed post");
    const mockFetch = vi.fn<typeof fetch>().mockRejectedValueOnce(networkError);
    globalThis.fetch = mockFetch;

    await expect(
      fetchWithTransientRetry("https://example.com/api/mutate", { method: "POST" }),
    ).rejects.toThrow(networkError);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(setTimeoutSpy).not.toHaveBeenCalled();
  });

  it("does NOT retry non-retryable status codes on GET (returns immediately)", async () => {
    const nonRetryableStatuses = [400, 401, 403, 404, 422, 429];

    for (const status of nonRetryableStatuses) {
      const mockFetch = vi
        .fn<typeof fetch>()
        .mockResolvedValueOnce(new Response(null, { status }));
      globalThis.fetch = mockFetch;

      const response = await fetchWithTransientRetry(`https://example.com/api/test-${status}`);

      expect(response.status).toBe(status);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    }
  });
});

describe("createClientConfig", () => {
  it("configures fetch with fetchWithTransientRetry", () => {
    const config = createClientConfig({
      baseUrl: "https://custom-url.test",
    });

    expect(config.fetch).toBe(fetchWithTransientRetry);
    expect(config.baseUrl).toBe("https://custom-url.test");
  });

  it("preserves fallback baseUrl when no override is provided", () => {
    const config = createClientConfig();
    expect(config.baseUrl).toBe("https://silatsense-be.vercel.app");
    expect(config.fetch).toBe(fetchWithTransientRetry);
  });
});
