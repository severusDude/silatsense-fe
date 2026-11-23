import { afterEach, describe, expect, it, vi } from "vitest";
import { prepareVideoFile, validateVideoDuration, validateVideoFile, videoFileAccept } from "@/features/member/video-file";

const limits = { acceptedMimeTypes: ["video/mp4", "video/quicktime", "video/webm"], maxBytes: 10_000_000, maxDurationSec: 60 };
const file = (type = "video/mp4", name = "latihan.mp4") => new File(["video"], name, { type });

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers(); });

function media(duration = 12) {
  const video = {
    preload: "", src: "", duration,
    onloadedmetadata: null as (() => void) | null,
    onerror: null as (() => void) | null,
    removeAttribute: vi.fn(), load: vi.fn(),
  };
  vi.stubGlobal("document", { createElement: vi.fn(() => video) });
  vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:local-preview");
  const revoke = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
  return { video, revoke };
}

describe("video file validation", () => {
  it("accepts configured formats and uses filename only when browser omits MIME", () => {
    expect(validateVideoFile(file(), limits)).toBe("video/mp4");
    expect(validateVideoFile(file("", "latihan.MOV"), limits)).toBe("video/quicktime");
    expect(validateVideoFile(file("video/webm;codecs=vp9", "latihan.webm"), limits)).toBe("video/webm");
  });
  it("rejects empty, oversized and unsupported or mismatched files", () => {
    expect(() => validateVideoFile(new File([], "empty.mp4", { type: "video/mp4" }), limits)).toThrow("kosong");
    expect(() => validateVideoFile(file(), { ...limits, maxBytes: 2 })).toThrow("Ukuran");
    expect(() => validateVideoFile(file("image/png", "gambar.png"), limits)).toThrow("Format");
    expect(() => validateVideoFile(file("video/webm", "latihan.mp4"), limits)).toThrow("Format");
    expect(() => validateVideoFile(file(), { ...limits, acceptedMimeTypes: ["video/webm"] })).toThrow("Format");
  });
  it("allows files above the old proxy cap when backend allows them", () => {
    const large = new File([new Uint8Array(5_000_000)], "latihan.mp4", { type: "video/mp4" });
    expect(validateVideoFile(large, limits)).toBe("video/mp4");
  });
  it("enforces finite positive duration and the exact backend duration limit", () => {
    expect(() => validateVideoDuration(60, 60)).not.toThrow();
    for (const duration of [0, -1, NaN, Infinity]) expect(() => validateVideoDuration(duration, 60)).toThrow("Durasi");
    expect(() => validateVideoDuration(60.1, 60)).toThrow("60 detik");
  });
  it("limits the file picker to backend-supported formats", () => {
    expect(videoFileAccept(["video/webm"])).toBe("video/webm,.webm");
    expect(videoFileAccept(["video/mp4", "video/quicktime"])).toContain(".mov");
    expect(videoFileAccept(["video/mp4"])).not.toContain(".webm");
  });
});

describe("local video preview lifecycle", () => {
  it("prepares the original file without uploading and keeps its filename and bytes", async () => {
    const { video, revoke } = media();
    const original = file();
    const pending = prepareVideoFile(original, limits, new AbortController().signal);
    video.onloadedmetadata!();
    const clip = await pending;
    expect(clip).toMatchObject({ blob: original, fileName: "latihan.mp4", source: "file", durationSec: 12, previewUrl: "blob:local-preview" });
    expect(clip.blob).toBe(original);
    expect(revoke).not.toHaveBeenCalled();
    expect(video.removeAttribute).toHaveBeenCalledWith("src");
  });
  it("releases preview resources when metadata duration exceeds the limit", async () => {
    const { video, revoke } = media(61);
    const pending = prepareVideoFile(file(), limits, new AbortController().signal);
    video.onloadedmetadata!();
    await expect(pending).rejects.toThrow("melebihi batas");
    expect(revoke).toHaveBeenCalledWith("blob:local-preview");
  });
  it("releases preview resources and listeners on cancellation", async () => {
    const { video, revoke } = media();
    const controller = new AbortController();
    const pending = prepareVideoFile(file(), limits, controller.signal);
    controller.abort();
    await expect(pending).rejects.toThrow("dibatalkan");
    expect(revoke).toHaveBeenCalledOnce(); expect(video.onloadedmetadata).toBeNull();
  });
  it("handles unreadable codecs without accepting a fake clip", async () => {
    const { video, revoke } = media();
    const pending = prepareVideoFile(file(), limits, new AbortController().signal);
    video.onerror!();
    await expect(pending).rejects.toThrow("H.264"); expect(revoke).toHaveBeenCalledOnce();
  });
  it("bounds metadata loading time and releases the preview URL", async () => {
    vi.useFakeTimers(); const { revoke } = media();
    const pending = prepareVideoFile(file(), limits, new AbortController().signal);
    const rejected = expect(pending).rejects.toThrow("terlalu lama");
    await vi.advanceTimersByTimeAsync(15_000);
    await rejected; expect(revoke).toHaveBeenCalledOnce();
  });
  it("does not allocate a preview for an already cancelled or invalid selection", async () => {
    media(); const controller = new AbortController(); controller.abort();
    await expect(prepareVideoFile(file(), limits, controller.signal)).rejects.toThrow();
    await expect(prepareVideoFile(file("text/plain", "file.txt"), limits, new AbortController().signal)).rejects.toThrow("Format");
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });
});
