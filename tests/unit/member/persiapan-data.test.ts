import { describe, expect, it } from "vitest";
import type { PersiapanDetail } from "@/features/member/types";
import {
  dummyPersiapanBySlug,
  persiapanSlugs,
} from "@/features/member/data/persiapan-dummy";

describe("dummyPersiapanBySlug", () => {
  it("resolves all four module slugs", () => {
    // Arrange + Act
    const slugs = [...persiapanSlugs].sort();

    // Assert
    expect(slugs).toEqual(["kuda-kuda", "pukulan", "tangkisan", "tendangan"]);
  });

  it("carries the Figma Kuda-kuda coach quote and calibration copy verbatim", () => {
    // Arrange + Act
    const detail = dummyPersiapanBySlug["kuda-kuda"];

    // Assert
    expect(detail.title).toBe("Kuda-kuda");
    expect(detail.coachQuote).toBe(
      "Buka kedua kaki selebar dua kali bahu, rendahkan panggul sejajar, pastikan lutut menekan ke luar dan punggung tetap tegak saat mengambil posisi Kuda Kuda.",
    );
    expect(detail.description).toBe(
      "Kalibrasi Pra-Latihan Biomekanika untuk mengukur simetri tumpuan kaki (50:50 COG), sudut fleksi lutut (130°–135°), dan tegak lurus sumbu aksial tulang belakang.",
    );
  });

  it("keeps four calibration checks and three posture guides per slug", () => {
    // Arrange + Act
    const details = persiapanSlugs.map((slug) => dummyPersiapanBySlug[slug]);

    // Assert
    for (const detail of details) {
      expect(detail.checks).toHaveLength(4);
      expect(detail.guides).toHaveLength(3);
    }
    expect(details[0].checks[0].title).toBe("Izin & Sensor Kamera");
    expect(details[0].checks[0].stateLabel).toBe("Aktif");
    expect(details[0].guides[0].term).toBe("Lebar Kaki:");
  });

  it("falls back to null for an unknown slug", () => {
    // Arrange + Act
    const lookup: Record<string, PersiapanDetail | undefined> =
      dummyPersiapanBySlug;
    const detail = lookup["jurus-tak-bernama"] ?? null;

    // Assert
    expect(detail).toBeNull();
  });
});
