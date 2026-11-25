import { beforeEach, describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";
const refresh = vi.hoisted(() => vi.fn());
vi.mock("@/features/auth/data/refresh-coordinator", () => ({ coordinatedRefresh: refresh }));
import { proxy } from "@/proxy";
beforeEach(() => vi.clearAllMocks());
const request = (path: string) => new NextRequest(`http://localhost${path}`, { headers: { Cookie: "ss_at=expired; ss_rt=test-refresh; ss_exp=1" } });
describe("proxy session recovery", () => {
 it("allows sign-in when refresh was revoked rather than redirecting back to dashboard", async () => {
  refresh.mockResolvedValue(new Response(null, { status: 401 }));
  const response = await proxy(request("/sign-in"));
  expect(response.headers.get("location")).toBeNull(); expect(response.cookies.get("ss_rt")?.value).toBe("");
 });
 it("keeps cookies on a network outage and does not redirect protected reads to login", async () => {
  refresh.mockRejectedValue(new Error("offline"));
  const response = await proxy(request("/latihan")); expect(response.headers.get("location")).toBeNull(); expect(response.headers.get("set-cookie")).toBeNull();
 });
 it("strips browser-supplied internal access headers", async () => {
  const response = await proxy(new NextRequest("http://localhost/", { headers: { "x-silatsense-access": "untrusted" } }));
  expect(response.headers.get("x-middleware-request-x-silatsense-access")).toBeNull();
 });
});
