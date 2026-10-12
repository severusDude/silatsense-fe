import { describe, expect, it } from "vitest";
import { formatFps, qualityLabel } from "@/features/member/camera-format";

describe("formatFps", () => {
  it("rounds fractional sensor rates to whole frames", () => {
    // Arrange + Act + Assert
    expect(formatFps(60.000240325927734)).toBe(60);
    expect(formatFps(29.970029830932617)).toBe(30);
    expect(formatFps(30)).toBe(30);
  });
});

describe("qualityLabel", () => {
  it("syncs the badge to the open stream settings", () => {
    // Arrange + Act + Assert
    expect(qualityLabel(1920, 1080, 60.000240325927734)).toBe("1080p @ 60 FPS");
    expect(qualityLabel(1280, 720, 29.970029830932617)).toBe("720p @ 30 FPS");
  });

  it("returns null while no stream is open", () => {
    // Arrange + Act + Assert
    expect(qualityLabel(undefined, undefined, undefined)).toBeNull();
    expect(qualityLabel(1920, 1080, undefined)).toBeNull();
  });
});
