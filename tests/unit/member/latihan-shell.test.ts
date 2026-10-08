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

describe("latihan route", () => {
  it("keeps the latihan route thin with no client boundary", () => {
    // Arrange + Act
    const layout = read("app/(member)/latihan/layout.tsx");
    const page = read("app/(member)/latihan/page.tsx");

    // Assert
    expect(layout).not.toContain("use client");
    expect(page).not.toContain("use client");
    expect(page).toContain("@/features/member/pages/latihan-page");
    expect(page).toContain("LatihanPage");
  });

  it("suspends hero and modules behind skeleton fallbacks", () => {
    // Arrange + Act
    const src = read("features/member/pages/latihan-page.tsx");

    // Assert
    expect(src).toContain("Suspense");
    expect(src).toContain("Skeleton");
    expect(src).toContain("getTrainingModules");
    expect(src).toContain("LatihanHero");
    expect(src).toContain("ModuleCardList");
  });

  it("marks Latihan active with real links and keeps dead TODOs for the rest", () => {
    // Arrange + Act
    const bottom = read("features/member/components/member-bottom-nav.tsx");

    // Assert
    expect(bottom).toContain("activeTab");
    expect(bottom).toContain('href="/latihan"');
    expect(bottom).toContain("aria-current");
    expect(bottom).toContain("TODO");
    expect(bottom).toContain("aria-disabled");
  });
});
