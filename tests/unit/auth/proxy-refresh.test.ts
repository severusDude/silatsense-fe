import { describe, expect, it } from "vitest";
import {
  isAuthRoute,
  isProtectedRoute,
  shouldRefresh,
} from "@/features/auth/data/proxy-refresh";

describe("shouldRefresh", () => {
  const now = 1_000_000;

  it("returns false if no refresh token exists", () => {
    expect(shouldRefresh({ accessToken: "at", now })).toBe(false);
  });

  it("returns true if refresh token exists but access token is missing", () => {
    expect(shouldRefresh({ refreshToken: "rt", now })).toBe(true);
  });

  it("returns true if token expires in less than 60 seconds", () => {
    expect(
      shouldRefresh({
        accessToken: "at",
        refreshToken: "rt",
        expiresAt: now + 59,
        now,
      })
    ).toBe(true);
  });

  it("returns false if token has 61 or more seconds remaining", () => {
    expect(
      shouldRefresh({
        accessToken: "at",
        refreshToken: "rt",
        expiresAt: now + 61,
        now,
      })
    ).toBe(false);
  });

  it("returns true if expiresAt is missing or invalid", () => {
    expect(
      shouldRefresh({
        accessToken: "at",
        refreshToken: "rt",
        now,
      })
    ).toBe(true);
  });
});

describe("isProtectedRoute", () => {
  it("identifies member routes as protected", () => {
    expect(isProtectedRoute("/dashboard")).toBe(true);
    expect(isProtectedRoute("/latihan/gerakan-dasar")).toBe(true);
    expect(isProtectedRoute("/riwayat/123")).toBe(true);
    expect(isProtectedRoute("/profil")).toBe(true);
  });

  it("identifies coach routes as protected", () => {
    expect(isProtectedRoute("/coach")).toBe(true);
    expect(isProtectedRoute("/coach/members/1")).toBe(true);
  });

  it("identifies public routes as non-protected", () => {
    expect(isProtectedRoute("/")).toBe(false);
    expect(isProtectedRoute("/sign-in")).toBe(false);
    expect(isProtectedRoute("/sign-up")).toBe(false);
  });
});

describe("isAuthRoute", () => {
  it("returns true for auth entry pages", () => {
    expect(isAuthRoute("/sign-in")).toBe(true);
    expect(isAuthRoute("/sign-up")).toBe(true);
  });

  it("returns false for other pages", () => {
    expect(isAuthRoute("/dashboard")).toBe(false);
    expect(isAuthRoute("/")).toBe(false);
  });
});
