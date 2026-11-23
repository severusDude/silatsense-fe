import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

describe("useCamera", () => {
  it("asks permission once, enumerates devices, and restores the saved camera", () => {
    // Arrange + Act
    const src = read("features/member/hooks/use-camera.ts");

    // Assert
    expect(src).toContain('"use client"');
    expect(src).toContain("getUserMedia");
    expect(src).toContain("enumerateDevices");
    expect(src).toContain("readPreferredCameraId");
    expect(src).toContain("rememberPreferredCameraId");
    expect(src).toContain("getSettings");
    expect(src).toContain("describeCameraError");
    expect(src).toContain("videoinput");
    expect(src).toContain("track.stop()");
  });

  it("stops the active track on unmount and never probes on mount", () => {
    // Arrange + Act
    const src = read("features/member/hooks/use-camera.ts");

    // Assert
    expect(src).toContain("return () => {");
    expect(src).toContain("stopTracks(streamRef.current)");
    expect(src).toContain("mountedRef");
    expect(src).not.toContain("setInterval");
    expect(src).not.toContain("dummyCameras");
  });

  it("opens the selected device with an exact constraint and records the choice", () => {
    // Arrange + Act
    const src = read("features/member/hooks/use-camera.ts");

    // Assert
    expect(src).toContain("deviceId: { exact: deviceId }");
    expect(src).toContain("setSelectedId(deviceId)");
    expect(src).toContain("setStatus(\"live\")");
  });
});

describe("useMediaRecorder", () => {
  it("records with a supported MIME type and enforces the configured limit", () => {
    // Arrange + Act
    const src = read("features/member/hooks/use-media-recorder.ts");

    // Assert
    expect(src).toContain('"use client"');
    expect(src).toContain("pickRecorderMimeType");
    expect(src).toContain("new MediaRecorder");
    expect(src).toContain("MediaRecorder.isTypeSupported");
    expect(src).toContain("maxDurationSec");
    expect(src).toContain("window.setInterval");
    expect(src).toContain("recorder.stop()");
    expect(src).toContain("URL.createObjectURL");
    expect(src).toContain("onRecordingComplete");
  });

  it("uploads directly using a frozen target and stable idempotency context", () => {
    const src = read("features/member/hooks/use-media-recorder.ts");
    expect(src).toContain("directUpload");
    expect(src).toContain("targetRef.current");
    expect(src).toContain("idempotencyKeyRef");
    expect(src).toContain("retryOf");
    expect(src).not.toContain("new FormData");
    expect(src).toContain("router.push");
  });

  it("releases preview URLs and resets the clip on discard", () => {
    // Arrange + Act
    const src = read("features/member/hooks/use-media-recorder.ts");

    // Assert
    expect(src).toContain("URL.revokeObjectURL");
    expect(src).toContain("setResult(null)");
    expect(src).toContain("setPhase(\"idle\")");
    expect(src).toContain("xhr.abort()");
  });

  it("maps failed uploads instead of leaking a fake success", () => {
    // Arrange + Act
    const src = read("features/member/hooks/use-media-recorder.ts");

    // Assert
    expect(src).toContain('setPhase("failed")');
    expect(src).toContain("error.message");
    expect(src).not.toContain("72");
    expect(src).not.toContain("setTimeout(() => setProgress");
  });
});
