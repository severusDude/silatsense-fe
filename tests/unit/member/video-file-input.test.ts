import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { VideoFileInput } from "@/features/member/components/video-file-input";
import { RecordingControls } from "@/features/member/components/recording-controls";

const props = { acceptedMimeTypes: ["video/mp4"], maxBytes: 10_000_000, maxDurationSec: 60, disabled: false, loading: false, clip: null, error: null, onSelect: vi.fn() };
describe("device video selection", () => {
  it("offers an accessible file picker with backend limits before upload", () => {
    const html = renderToStaticMarkup(createElement(VideoFileInput, props));
    expect(html).toContain("Pilih File Video"); expect(html).toContain("Video belum dikirim saat dipilih");
    expect(html).toContain('type="file"'); expect(html).toContain('accept="video/mp4,.mp4"'); expect(html).toContain("60 detik");
  });
  it("requires a target before selection and exposes validation errors", () => {
    const html = renderToStaticMarkup(createElement(VideoFileInput, { ...props, disabled: true, error: "File kosong" }));
    expect(html).toContain("Pilih target gerakan terlebih dahulu"); expect(html).toContain("disabled"); expect(html).toContain("File kosong");
  });
  it("renders an uncropped local preview and an upload confirmation for selected files", () => {
    const clip = { blob: new Blob(), previewUrl: "blob:preview", durationSec: 12, byteSize: 500, mimeType: "video/mp4", fileName: "latihan.mp4", source: "file" as const };
    const html = renderToStaticMarkup(createElement(VideoFileInput, { ...props, clip }));
    expect(html).toContain("object-contain"); expect(html).toContain("latihan.mp4"); expect(html).toContain("Siap diunggah");
    const controls = renderToStaticMarkup(createElement(RecordingControls, {
      phase: "recorded", countdownRemaining: 0, elapsedSec: 12, progress: 0, error: null, result: clip,
      canStart: false, canUpload: true, maxDurationSec: 60, uploadLimitLabel: "10 MB",
      onStart: vi.fn(), onCancel: vi.fn(), onStop: vi.fn(), onDiscard: vi.fn(), onUpload: vi.fn(),
    }));
    expect(controls).toContain("Unggah Video"); expect(controls).toContain("Pilih Video Lain");
    expect(controls).not.toContain("Rekam Ulang");
  });
});
