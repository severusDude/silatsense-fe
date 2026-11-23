import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ token: vi.fn(), cookies: vi.fn(), setCookies: vi.fn(), rotate: vi.fn() }));
vi.mock("@/features/auth/data/session", () => ({ getAccessToken: mocks.token }));
vi.mock("@/features/auth/data/session-cookies", () => ({ getSessionCookies: mocks.cookies, setSessionCookies: mocks.setCookies }));
vi.mock("@/features/auth/data/rotate-session", () => ({ rotateSession: mocks.rotate }));
import { authenticatedRequest } from "@/features/auth/data/authenticated-request";
beforeEach(() => { vi.clearAllMocks(); mocks.token.mockResolvedValue("expired"); mocks.cookies.mockResolvedValue({ refreshToken: "refresh-test", rememberMe: true }); });
describe("authenticated request recovery", () => {
 it("rotates cookies and retries once with a request-scoped token on unauthorized", async () => {
  const request = vi.fn().mockResolvedValueOnce({ response: new Response(null, { status: 401 }) }).mockResolvedValueOnce({ data: "ok", response: new Response() });
  mocks.rotate.mockResolvedValue({ ok: true, data: { accessToken: "fresh", rotatedRefreshToken: "rotated", expiresIn: 900 } });
  expect(await authenticatedRequest(request)).toMatchObject({ data: "ok" });
  expect(request.mock.calls.map((call) => call[0])).toEqual(["expired", "fresh"]);
  expect(mocks.setCookies).toHaveBeenCalledWith({ accessToken: "fresh", refreshToken: "rotated", expiresIn: 900, rememberMe: true });
 });
 it("does not rotate or replay mutations on server failures", async () => {
  const request = vi.fn().mockResolvedValue({ response: new Response(null, { status: 503 }) }); await authenticatedRequest(request);
  expect(request).toHaveBeenCalledTimes(1); expect(mocks.rotate).not.toHaveBeenCalled();
 });
 it("preserves cookies and returns unauthorized during refresh network outage", async () => {
  const request = vi.fn().mockResolvedValue({ response: new Response(null, { status: 401 }) }); mocks.rotate.mockResolvedValue({ ok: false, status: 503 });
  expect((await authenticatedRequest(request)).response?.status).toBe(401);
  expect(request).toHaveBeenCalledTimes(1); expect(mocks.setCookies).not.toHaveBeenCalled();
 });
});
