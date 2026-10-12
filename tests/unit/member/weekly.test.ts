import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

describe("weekly-progress", () => {
  it("maps all seven days with data-driven bars and rest/empty states", () => {
    // Arrange + Act
    const src = read("features/member/components/weekly-progress.tsx");

    // Assert
    expect(src).toContain("weekly.days.map");
    expect(src).toContain('day.state === "rest"');
    expect(src).toContain("border-dashed");
  });

  it("renders the week label and coach note from props", () => {
    // Arrange + Act
    const src = read("features/member/components/weekly-progress.tsx");

    // Assert
    expect(src).toContain("weekLabel");
    expect(src).toContain("blockquote");
    expect(src).toContain("note.quote");
  });

  it("uses flex layout with no hard placement", () => {
    // Arrange + Act
    const src = read("features/member/components/weekly-progress.tsx");

    // Assert
    expect(src).toContain("flex");
    expect(src).not.toContain("absolute");
  });
});
