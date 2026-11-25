import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { initUpload, completeUpload } from "@/features/member/actions/direct-upload";
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/features/auth/data/authenticated-request", () => ({ authenticatedRequest: (request: (token: string) => unknown) => request("test-only-token") }));
const config = { movementSlug: "pukulan", maxBytes: 100_000_000, maxDurationSeconds: 60, recommendedDurationSeconds: 30, acceptedMimeTypes: ["video/webm"], movements: [{ id: "pukulan_depan", name: "Pukulan depan" }], movementIdRequired: true, analysisMethod: "coach-reference-dtw" };
const input = { movementSlug: "pukulan", movementId: "pukulan_depan", filename: "clip.webm", mimeType: "video/webm", byteSize: 8_000_000, sha256: "a".repeat(64), retryOf: "previous" };
const fetcher = vi.fn();
beforeEach(() => { fetcher.mockReset(); vi.stubGlobal("fetch", fetcher); });
afterEach(() => vi.unstubAllGlobals());
describe("authenticated upload metadata actions", () => {
 it("validates metadata before contacting backend", async () => { expect((await initUpload({ ...input, sha256: "bad" }, "key")).ok).toBe(false); expect(fetcher).not.toHaveBeenCalled(); });
 it("rejects missing or mismatched target according to record-config", async () => {
   fetcher.mockImplementation(async () => Response.json(config));
   expect((await initUpload({ ...input, movementId: undefined }, "key")).ok).toBe(false);
   expect((await initUpload({ ...input, movementId: "tendangan_depan" }, "key")).ok).toBe(false);
   expect(fetcher).toHaveBeenCalledTimes(2);
 });
 it("uses backend file limit and forwards movement, checksum, retry and idempotency", async () => {
   fetcher.mockResolvedValueOnce(Response.json(config)).mockResolvedValueOnce(Response.json({ uploadId: "up", uploadUrl: "https://storage.invalid/signed", headers: { "Content-Type": "video/webm" }, expiresAt: "2099-01-01T00:00:00Z", completePath: "/api/v1/member/uploads/up/complete" }, { status: 201 }));
   expect((await initUpload(input, "stable-key")).ok).toBe(true);
   const request = fetcher.mock.calls[1][0] as Request;
   expect(request.method).toBe("POST"); expect(request.headers.get("Idempotency-Key")).toBe("stable-key"); expect(request.headers.get("authorization")).toBe("Bearer test-only-token"); expect(await request.json()).toMatchObject(input);
 });
 it("rejects files above backend limit without allocating a ticket", async () => {
   fetcher.mockResolvedValueOnce(Response.json({ ...config, maxBytes: 1 }));
   expect((await initUpload(input, "key")).ok).toBe(false); expect(fetcher).toHaveBeenCalledTimes(1);
 });
 it("completes the original upload id and revalidates history", async () => {
   fetcher.mockResolvedValue(Response.json({ sessionId: "session", statusUrl: "/status", evaluationUrl: "/eval", uploadedAt: "2026-11-23T00:00:00Z" }, { status: 202 }));
   const result = await completeUpload("upload-original"); expect(result.ok).toBe(true);
   const request = fetcher.mock.calls[0][0] as Request; expect(new URL(request.url).pathname).toBe("/api/v1/member/uploads/upload-original/complete");
   const { revalidatePath } = await import("next/cache"); expect(revalidatePath).toHaveBeenCalledWith("/riwayat");
 });
});
