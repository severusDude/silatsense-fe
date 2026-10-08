import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { pillarBadgeVariant } from "@/features/member/components/pillar-status";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

describe("pillarBadgeVariant", () => {
  it("maps stabil to the success tint", () => {
    expect(pillarBadgeVariant("stabil")).toBe("success");
  });

  it("maps optimal to the success tint", () => {
    expect(pillarBadgeVariant("optimal")).toBe("success");
  });

  it("maps perlu-koreksi to the warning tint", () => {
    expect(pillarBadgeVariant("perlu-koreksi")).toBe("warning");
  });
});

describe("pillar-grid", () => {
  it("renders the Figma section header with active-card affordance", () => {
    // Arrange + Act
    const src = read("features/member/components/pillar-grid.tsx");

    // Assert
    expect(src).toContain("Kategori Gerakan Dasar");
    expect(src).toContain("ChevronRight");
    expect(src).toContain("border-primary");
  });
});

describe("session-feedback", () => {
  it("renders all three observation tones with lucide icons, never emoji", () => {
    // Arrange + Act
    const src = read("features/member/components/session-feedback.tsx");

    // Assert
    expect(src).toContain("Ulangi Latihan Gerakan Ini");
    expect(src).toContain("CircleCheck");
    expect(src).toContain("TriangleAlert");
    expect(src).toContain("Lightbulb");
    expect(src).not.toContain("💡");
    expect(src).not.toContain("absolute");
  });
});
