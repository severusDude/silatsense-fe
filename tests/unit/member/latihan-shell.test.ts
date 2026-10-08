import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

describe("latihan components", () => {
  it("renders the estimate badge inline-end only when the label exists", () => {
    // Arrange + Act
    const src = read("features/member/components/module-card.tsx");

    // Assert
    expect(src).toContain("items-start justify-between");
    expect(src).toContain("estimateLabel ?");
    expect(src).toContain('variant="outline"');
  });

  it("keeps cards flex-only with placeholders and dead CTAs", () => {
    // Arrange + Act
    const card = read("features/member/components/module-card.tsx");
    const list = read("features/member/components/module-card-list.tsx");
    const hero = read("features/member/components/latihan-hero.tsx");

    // Assert
    for (const src of [card, list, hero]) {
      expect(src).not.toContain("absolute");
    }
    expect(card).toContain("ImagePlaceholder");
    expect(card).toContain("TODO");
    expect(card).toContain("/latihan/[slug]");
    expect(card).toContain("aria-disabled");
    expect(card).not.toContain("Sensor Siap");
    expect(list).toContain("ModuleCard");
  });
});
