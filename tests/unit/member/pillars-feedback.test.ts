import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { pillarBadgeVariant } from "@/features/member/components/pillar-status";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

describe("pillarBadgeVariant", () => {
  it("maps stabil, optimal, and terdata to the success tint", () => {
    expect(pillarBadgeVariant("stabil")).toBe("success");
    expect(pillarBadgeVariant("optimal")).toBe("success");
    expect(pillarBadgeVariant("terdata")).toBe("success");
  });

  it("maps belum-dinilai to the secondary tint", () => {
    expect(pillarBadgeVariant("belum-dinilai")).toBe("secondary");
  });

  it("maps perlu-koreksi to the warning tint", () => {
    expect(pillarBadgeVariant("perlu-koreksi")).toBe("warning");
  });
});

describe("pillar-grid", () => {
  it("renders the section header with active-card affordance and live Links", () => {
    // Arrange + Act
    const src = read("features/member/components/pillar-grid.tsx");

    // Assert
    expect(src).toContain("Kategori Gerakan Dasar");
    expect(src).toContain("ChevronRight");
    expect(src).toContain("border-primary");
    expect(src).toContain("href={pillar.href}");
    expect(src).not.toContain("aria-disabled");
  });
});

describe("session-feedback", () => {
  it("renders empty state, all three observation tones with lucide icons, and live CTAs", () => {
    // Arrange + Act
    const src = read("features/member/components/session-feedback.tsx");

    // Assert
    expect(src).toContain("Belum ada sesi latihan mandiri");
    expect(src).toContain("Ulangi Latihan Gerakan Ini");
    expect(src).toContain("Lihat Detail Evaluasi");
    expect(src).toContain("CircleCheck");
    expect(src).toContain("TriangleAlert");
    expect(src).toContain("Lightbulb");
    expect(src).not.toContain("💡");
    expect(src).not.toContain("absolute");
    expect(src).not.toContain("aria-disabled");
  });
});
