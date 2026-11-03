import { describe, expect, it } from "vitest";
import { normalizeApiError } from "@/lib/api-client";

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
