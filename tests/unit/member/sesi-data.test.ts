import { describe, expect, it } from "vitest";
import type { TrainingSession } from "@/features/member/types";
import { dummySesiBySlug } from "@/features/member/data/sesi-dummy";
import { persiapanSlugs } from "@/features/member/data/persiapan-dummy";

describe("dummySesiBySlug", () => {
  it("resolves all four module slugs", () => {
    // Arrange + Act
    const slugs = [...persiapanSlugs].sort();

    // Assert
    expect(slugs).toEqual(["kuda-kuda", "pukulan", "tangkisan", "tendangan"]);
    for (const slug of persiapanSlugs) {
      expect(dummySesiBySlug[slug].slug).toBe(slug);
    }
  });

  it("carries the Kuda-kuda 7 info fields verbatim", () => {
    // Arrange + Act
    const detail = dummySesiBySlug["kuda-kuda"];

    // Assert
    expect(detail.trainingName).toBe("Kuda-kuda");
    expect(detail.eyebrow).toBe("ULASAN SESI");
    expect(detail.durationSec).toBe(47);
    expect(detail.durationLabel).toBe("00:47");
    expect(detail.recordedAtLabel).toBe("10 Okt 2026 • 09.41");
    expect(detail.fileSizeLabel).toBe("18,2 MB");
    expect(detail.camera.label).toBe("Kamera Terintegrasi");
    expect(detail.camera.resolution).toBe("1280×720");
    expect(detail.camera.fps).toBe(30);
    expect(detail.videoStatus).toBe("recorded");
  });

  it("falls back to null for an unknown slug", () => {
    // Arrange + Act
    const lookup: Record<string, TrainingSession | undefined> =
      dummySesiBySlug;
    const detail = lookup["jurus-tak-bernama"] ?? null;

    // Assert
    expect(detail).toBeNull();
  });
});
