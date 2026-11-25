import { afterEach, describe, expect, it, vi } from "vitest";
import { coordinatedRefresh } from "@/features/auth/data/refresh-coordinator";
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });
describe("parallel session refresh", () => {
 it("shares in-flight refresh and successful rotation for 30 seconds per session", async () => {
  vi.useFakeTimers(); const fetcher = vi.fn().mockImplementation(async () => Response.json({ accessToken: "disposable", expiresIn: 900 })); vi.stubGlobal("fetch", fetcher);
  const [a,b] = await Promise.all([coordinatedRefresh("session-one"), coordinatedRefresh("session-one")]);
  expect(await a.json()).toEqual(await b.json()); expect(fetcher).toHaveBeenCalledTimes(1);
  await coordinatedRefresh("session-one"); expect(fetcher).toHaveBeenCalledTimes(1);
  await coordinatedRefresh("session-two"); expect(fetcher).toHaveBeenCalledTimes(2);
  vi.advanceTimersByTime(30_001); await coordinatedRefresh("session-one"); expect(fetcher).toHaveBeenCalledTimes(3);
 });
 it("does not cache network failures or log out on a transport failure", async () => {
  const fetcher = vi.fn().mockRejectedValueOnce(new Error("offline")).mockResolvedValue(Response.json({ ok: true })); vi.stubGlobal("fetch", fetcher);
  await expect(coordinatedRefresh("offline-session")).rejects.toThrow("offline"); await coordinatedRefresh("offline-session"); expect(fetcher).toHaveBeenCalledTimes(2);
 });
});
