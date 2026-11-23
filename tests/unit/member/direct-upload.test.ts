import { describe, it, expect, vi } from "vitest";
import type { UploadRequest, UploadTicket, AcceptedSession } from "@/api";
import { checksum, directUpload, putVideo, type UploadState } from "@/features/member/direct-upload";
const metadata: UploadRequest = { movementSlug: "pukulan", movementId: "pukulan_depan", filename: "clip.webm", mimeType: "video/webm", byteSize: 10, sha256: "a".repeat(64), retryOf: "source" };
const ticket: UploadTicket = { uploadId: "upload", uploadUrl: "https://storage.invalid/signed", headers: { "Content-Type": "video/webm" }, expiresAt: "2099-01-01T00:00:00Z", completePath: "/api/v1/member/uploads/upload/complete" };
const accepted: AcceptedSession = { sessionId: "session", processingStatus: "queued", statusUrl: "/api/v1/member/sessions/session", evaluationUrl: "/api/v1/member/sessions/session/evaluation", uploadedAt: "2026-11-23T00:00:00Z" };
function actions() { return { initAction: vi.fn().mockResolvedValue({ ok: true, data: ticket }), completeAction: vi.fn().mockResolvedValue({ ok: true, data: accepted }) }; }
const signal = () => new AbortController().signal;
describe("direct browser upload", () => {
  it("hashes the original bytes with SHA256", async () => { expect(await checksum(new Blob(["abc"]))).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"); });
  it("sends metadata and target with the key, then PUTs raw video before completing", async () => {
    const api = actions(), state: UploadState = {}, blob = new Blob(["video"]), calls: string[] = [];
    api.initAction.mockImplementation(async () => { calls.push("init"); return { ok: true, data: ticket }; });
    api.completeAction.mockImplementation(async () => { calls.push("complete"); return { ok: true, data: accepted }; });
    const put = vi.fn(async () => { calls.push("put"); });
    expect(await directUpload(state, metadata, "same-key", blob, api, put, signal())).toEqual(accepted);
    expect(api.initAction).toHaveBeenCalledWith(metadata, "same-key"); expect(put).toHaveBeenCalledWith(ticket, blob);
    expect(api.completeAction).toHaveBeenCalledWith("upload"); expect(calls).toEqual(["init", "put", "complete"]);
  });
  it("recovers complete failure without another ticket or another PUT", async () => {
    const api = actions(), state: UploadState = {}, put = vi.fn().mockResolvedValue(undefined);
    api.completeAction.mockResolvedValueOnce({ ok: false, error: { message: "Coba konfirmasi lagi" } });
    await expect(directUpload(state, metadata, "key", new Blob(), api, put, signal())).rejects.toThrow("Video sudah terunggah");
    await directUpload(state, metadata, "key", new Blob(), api, put, signal());
    expect(api.initAction).toHaveBeenCalledTimes(1); expect(put).toHaveBeenCalledTimes(1); expect(api.completeAction).toHaveBeenCalledTimes(2);
  });
  it("never completes a failed PUT and retains the ticket for retry", async () => {
    const api = actions(), state: UploadState = {}, put = vi.fn().mockRejectedValueOnce(new Error("CORS")).mockResolvedValue(undefined);
    await expect(directUpload(state, metadata, "key", new Blob(), api, put, signal())).rejects.toThrow("CORS");
    expect(api.completeAction).not.toHaveBeenCalled();
    await directUpload(state, metadata, "key", new Blob(), api, put, signal()); expect(api.initAction).toHaveBeenCalledTimes(1);
  });
  it("uses acceptedSession without reuploading", async () => {
    const api = actions(); api.initAction.mockResolvedValue({ ok: true, data: { ...ticket, acceptedSession: accepted } }); const put = vi.fn();
    expect(await directUpload({}, metadata, "key", new Blob(), api, put, signal())).toEqual(accepted);
    expect(put).not.toHaveBeenCalled(); expect(api.completeAction).not.toHaveBeenCalled();
  });
  it("refreshes an expired ticket with the original key", async () => {
    const api = actions(), state: UploadState = { ticket: { ...ticket, expiresAt: "2000-01-01T00:00:00Z" } };
    await directUpload(state, metadata, "original-key", new Blob(), api, vi.fn(), signal()); expect(api.initAction).toHaveBeenCalledWith(metadata, "original-key");
  });
  it("does not start work after cancellation", async () => {
    const api = actions(), controller = new AbortController(); controller.abort();
    await expect(directUpload({}, metadata, "key", new Blob(), api, vi.fn(), controller.signal)).rejects.toThrow(); expect(api.initAction).not.toHaveBeenCalled();
  });
  it("cancellation after PUT keeps completion recoverable", async () => {
    const api = actions(), state: UploadState = {}, controller = new AbortController();
    await expect(directUpload(state, metadata, "key", new Blob(), api, async () => { controller.abort(); }, controller.signal)).rejects.toThrow();
    expect(state.putComplete).toBe(true); expect(api.completeAction).not.toHaveBeenCalled();
    const put = vi.fn(); await directUpload(state, metadata, "key", new Blob(), api, put, signal()); expect(put).not.toHaveBeenCalled();
  });
  it("omits credentials, sends only ticket headers and raw bytes, reports real progress", async () => {
    let xhr!: { open: ReturnType<typeof vi.fn>; setRequestHeader: ReturnType<typeof vi.fn>; send: ReturnType<typeof vi.fn>; withCredentials: boolean; timeout: number; status: number; upload: { onprogress?: (event: object) => void }; onload?: () => void; abort: () => void };
    vi.stubGlobal("XMLHttpRequest", class { constructor() { xhr = this as unknown as typeof xhr; } open = vi.fn(); setRequestHeader = vi.fn(); send = vi.fn(); withCredentials = true; timeout = 0; status = 200; upload = {}; abort() {} });
    try { const blob = new Blob(["raw"]), progress = vi.fn(); const pending = putVideo(ticket, blob, progress, signal(), () => {});
      expect(xhr.withCredentials).toBe(false); expect(xhr.open).toHaveBeenCalledWith("PUT", ticket.uploadUrl); expect(xhr.send).toHaveBeenCalledWith(blob);
      expect(xhr.setRequestHeader).toHaveBeenCalledTimes(1); xhr.upload.onprogress!({ lengthComputable: true, loaded: 5, total: 10 }); expect(progress).toHaveBeenCalledWith(50);
      xhr.onload!(); await pending;
    } finally { vi.unstubAllGlobals(); }
  });
});
