import { describe, expect, it } from "vitest";
import type { RekamSession } from "@/features/member/types";
import { dummyRekamBySlug } from "@/features/member/data/rekam-dummy";
import { persiapanSlugs } from "@/features/member/data/persiapan-dummy";

describe("dummyRekamBySlug", () => {
  it("resolves all four module slugs", () => {
    // Arrange + Act
    const slugs = [...persiapanSlugs].sort();

    // Assert
    expect(slugs).toEqual(["kuda-kuda", "pukulan", "tangkisan", "tendangan"]);
    for (const slug of persiapanSlugs) {
      expect(dummyRekamBySlug[slug].slug).toBe(slug);
    }
  });

  it("carries the Kuda-kuda screen copy verbatim", () => {
    // Arrange + Act
    const detail = dummyRekamBySlug["kuda-kuda"];

    // Assert
    expect(detail.trainingName).toBe("Kuda-kuda");
    expect(detail.eyebrow).toBe("MULAI LATIHAN");
    expect(detail.countdownSec).toBe(3);
    expect(detail.targetDurationSec).toBe(60);
  });

  it("carries the default camera on every slug", () => {
    // Arrange + Act
    const details = persiapanSlugs.map((slug) => dummyRekamBySlug[slug]);

    // Assert
    for (const detail of details) {
      expect(detail.camera.id).toBe("integrated");
      expect(detail.camera.label).toBe("Kamera Terintegrasi");
      expect(detail.camera.resolution).toBe("1280×720");
      expect(detail.camera.fps).toBe(30);
    }
  });

  it("falls back to null for an unknown slug", () => {
    // Arrange + Act
    const lookup: Record<string, RekamSession | undefined> =
      dummyRekamBySlug;
    const detail = lookup["jurus-tak-bernama"] ?? null;

    // Assert
    expect(detail).toBeNull();
  });
});
