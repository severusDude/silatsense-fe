import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

describe("hero-greeting", () => {
  it("renders the greeting copy with both live Link CTAs", () => {
    // Arrange + Act
    const src = read("features/member/components/hero-greeting.tsx");

    // Assert
    expect(src).toContain("Halo,");
    expect(src).toContain("Mulai Sesi Latihan");
    expect(src).toContain("Lihat Panduan Biomekanik");
    expect(src).toContain('href="/latihan"');
    expect(src).toContain("greeting.focusSlug");
  });

  it("uses live Links and lucide icons without dead aria-disabled stubs", () => {
    // Arrange + Act
    const src = read("features/member/components/hero-greeting.tsx");

    // Assert
    expect(src).not.toContain("aria-disabled");
    expect(src).not.toContain("TODO");
    expect(src).toContain("ArrowRight");
    expect(src).toContain("BookOpen");
  });
});

describe("hero-visual-card", () => {
  it("renders similarity score readout and honest inactive sensor badge", () => {
    // Arrange + Act
    const src = read("features/member/components/hero-visual-card.tsx");

    // Assert
    expect(src).toContain("metric.scoreLabel");
    expect(src).toContain("ImagePlaceholder");
    expect(src).toContain("metric.sensorTelemetry.label");
    expect(src).toContain("border-dashed");
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
