import { describe, expect, it } from "vitest";
import type { EvaluationSession } from "@/features/member/types";
import { dummyEvaluasiBySlug } from "@/features/member/data/evaluasi-dummy";

describe("dummyEvaluasiBySlug", () => {
  it("resolves all four module slugs", () => {
    // Arrange + Act
    const slugs = Object.keys(dummyEvaluasiBySlug).sort();

    // Assert
    expect(slugs).toEqual(["kuda-kuda", "pukulan", "tangkisan", "tendangan"]);
    for (const slug of slugs) {
      expect(dummyEvaluasiBySlug[slug as keyof typeof dummyEvaluasiBySlug].slug).toBe(slug);
    }
  });

  it("carries the pukulan evaluation verbatim with no speedLabel", () => {
    // Arrange + Act
    const detail = dummyEvaluasiBySlug["pukulan"];

    // Assert
    expect(detail.techniqueName).toBe("Pukulan Lurus Depan");
    expect(detail.evaluatedAtLabel).toBe("28 Sep 2026, 16:45 WIB");
    expect(detail.validReps).toBe(12);
    expect(detail.deviatedReps).toBe(3);
    expect(detail.qualityLabel).toBe("1080p@60FPS");
    expect(detail.score.value).toBe(80);
    expect(detail.score.targetPct).toBe(85);
    expect(detail.score.deltaLabel).toBe("Selisih -5%");
    expect(detail.score.alertLabel).toBe("PERLU PERBAIKAN");
    expect(detail.postures).toHaveLength(5);
    expect(detail.postures.map((posture) => posture.name)).toEqual([
      "Bahu",
      "Siku Kanan",
      "Pinggul",
      "Lutut",
      "Pergelangan",
    ]);
    expect(detail.postures[1]?.statusLabel).toBe("TIDAK SESUAI (142°)");
    expect(detail.videoStatus).toBe("placeholder");
    expect(detail).not.toHaveProperty("speedLabel");
  });

  it("falls back to null for an unknown slug", () => {
    // Arrange + Act
    const lookup: Record<string, EvaluationSession | undefined> =
      dummyEvaluasiBySlug;
    const detail = lookup["jurus-tak-bernama"] ?? null;

    // Assert
    expect(detail).toBeNull();
  });
});
