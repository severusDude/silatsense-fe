import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
vi.mock("@/features/auth/data/session", () => ({ getAccessToken: async () => "test-token" }));
vi.mock("react", () => ({ cache: (fn: unknown) => fn }));
import { getPose } from "@/features/member/data/get-pose";
const fetcher = vi.fn();
beforeEach(() => { fetcher.mockReset(); vi.stubGlobal("fetch", fetcher); });
afterEach(() => vi.unstubAllGlobals());
describe("private pose reads", () => {
 it.each(["member", "coach"] as const)("uses the %s endpoint with authentication and tolerates a legacy pose response", async (role) => {
   fetcher.mockResolvedValue(Response.json({ sessionId: "1", pose: null, reason: "not_available" }));
   const pose = await getPose("1", role); expect(pose.timeline).toBeNull();
   const request = fetcher.mock.calls[0][0] as Request; expect(new URL(request.url).pathname).toBe(`/api/v1/${role}/sessions/1/pose`); expect(request.headers.get("authorization")).toBe("Bearer test-token");
 });
 it("keeps a failure separate from an empty valid timeline", async () => {
   fetcher.mockResolvedValue(Response.json({ sessionId: "1", pose: null, reason: null, timeline: { imageWidth: 640, imageHeight: 480, frames: [] } }));
   const pose = await getPose("1", "coach"); expect(pose.timeline?.frames).toEqual([]); expect(pose.error).toBeUndefined();
 });
 it("shows unavailable pose without hiding evaluation when media is expired", async () => {
   fetcher.mockResolvedValue(Response.json({ code: "gone" }, { status: 410 }));
   expect((await getPose("1", "member")).error).toContain("Hasil evaluasi tetap dapat dibaca");
 });
});
