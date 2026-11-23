import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
vi.mock("@/features/auth/data/session", () => ({ getAccessToken: async () => "coach-token" }));
vi.mock("@/features/auth/data/authenticated-request", () => ({ authenticatedRequest: (fn: (token: string) => unknown) => fn("coach-token") }));
import { GET } from "@/app/api/coach/sessions/[sessionId]/video/route";
const fetcher = vi.fn();
beforeEach(() => { fetcher.mockReset(); vi.stubGlobal("fetch", fetcher); });
afterEach(() => vi.unstubAllGlobals());
describe("Coach private playback", () => {
 it("streams ranges only through the Coach backend endpoint", async () => {
  fetcher.mockResolvedValue(new Response(new Uint8Array([1,2]), { status: 206, headers: { "Content-Type": "video/mp4", "Content-Range": "bytes 0-1/2", "Accept-Ranges": "bytes" } }));
  const response = await GET(new Request("http://localhost/api/coach/sessions/1/video", { headers: { Range: "bytes=0-1" } }), { params: Promise.resolve({ sessionId: "1" }) });
  expect(response.status).toBe(206); expect(response.headers.get("Content-Range")).toBe("bytes 0-1/2");
  const request = fetcher.mock.calls[0][0] as Request; expect(new URL(request.url).pathname).toBe("/api/v1/coach/sessions/1/video"); expect(request.headers.get("Range")).toBe("bytes=0-1");
 });
 it.each([404, 410])("preserves %s instead of falling back to Member", async (status) => {
  fetcher.mockResolvedValue(Response.json({ detail: "Media tidak tersedia", code: "gone", requestId: "test" }, { status }));
  const response = await GET(new Request("http://localhost/api/coach/sessions/1/video"), { params: Promise.resolve({ sessionId: "1" }) }); expect(response.status).toBe(status); expect(fetcher).toHaveBeenCalledTimes(1);
 });
});
