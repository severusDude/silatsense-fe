import { describe, expect, it } from "vitest";
import {
  AUTH_ACCESS_TOKEN_COOKIE,
  AUTH_EXPIRY_COOKIE,
  AUTH_REFRESH_TOKEN_COOKIE,
  AUTH_REMEMBER_COOKIE,
  extractCookieValue,
  getCookieBaseOptions,
} from "@/features/auth/data/session-cookies";

describe("session cookie constants and options", () => {
  it("defines standard ss_* cookie names", () => {
    expect(AUTH_ACCESS_TOKEN_COOKIE).toBe("ss_at");
    expect(AUTH_REFRESH_TOKEN_COOKIE).toBe("ss_rt");
    expect(AUTH_EXPIRY_COOKIE).toBe("ss_exp");
    expect(AUTH_REMEMBER_COOKIE).toBe("ss_remember");
  });

  it("sets secure httpOnly lax cookie options", () => {
    const opts = getCookieBaseOptions();
    expect(opts.httpOnly).toBe(true);
    expect(opts.sameSite).toBe("lax");
    expect(opts.path).toBe("/");
  });
});

describe("extractCookieValue", () => {
  it("extracts named cookie from single Set-Cookie header", () => {
    const header = "refresh_token=secret_rt_123; Path=/; HttpOnly; SameSite=Strict";
    expect(extractCookieValue(header, "refresh_token")).toBe("secret_rt_123");
  });

  it("extracts named cookie from array of Set-Cookie headers", () => {
    const headers = [
      "ss_at=token_val; Path=/",
      "refresh_token=secret_rotated_456; Path=/; HttpOnly",
    ];
    expect(extractCookieValue(headers, "refresh_token")).toBe("secret_rotated_456");
  });

  it("returns undefined if cookie is missing", () => {
    const header = "other=val; Path=/";
    expect(extractCookieValue(header, "refresh_token")).toBeUndefined();
    expect(extractCookieValue(null, "refresh_token")).toBeUndefined();
  });
});
