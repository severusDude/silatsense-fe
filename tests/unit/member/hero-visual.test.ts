import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

describe("hero-greeting", () => {
  it("renders the Figma greeting copy with both CTAs", () => {
    // Arrange + Act
    const src = read("features/member/components/hero-greeting.tsx");

    // Assert
    expect(src).toContain("Halo,");
    expect(src).toContain("Mulai Sesi Latihan");
    expect(src).toContain("Lihat Panduan Biomekanik");
  });

  it("keeps CTAs dead with TODOs and lucide icons", () => {
    // Arrange + Act
    const src = read("features/member/components/hero-greeting.tsx");

    // Assert
    expect(src).toContain("aria-disabled");
    expect(src).toContain("TODO");
    expect(src).toContain("ArrowRight");
    expect(src).toContain("BookOpen");
  });
});

describe("hero-visual-card", () => {
  it("renders the Figma accuracy badge content", () => {
    // Arrange + Act
    const src = read("features/member/components/hero-visual-card.tsx");

    // Assert
    expect(src).toContain("Kamera Siap");
    expect(src).toContain("ImagePlaceholder");
    expect(src).toContain("Jarak");
  });

  it("uses flex layout with no hard placement or emoji", () => {
    // Arrange + Act
    const greeting = read("features/member/components/hero-greeting.tsx");
    const visual = read("features/member/components/hero-visual-card.tsx");

    // Assert
    expect(greeting).not.toContain("absolute");
    expect(visual).not.toContain("absolute");
    expect(visual).not.toContain("💡");
  });
});
