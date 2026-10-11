import { describe, expect, it } from "vitest";
import { auditIssues } from "@/scripts/linear-roadmap-audit.mjs";

const issue = (overrides: Record<string, unknown> = {}) => ({
  id: "PSR-X",
  title: "[riwayat] Ship history screens",
  labels: ["feature"],
  projectMilestone: { id: "m8", name: "[Phase 8] Riwayat history" },
  ...overrides,
});

describe("auditIssues", () => {
  it("passes a clean parent plus subs set", () => {
    // Arrange
    const issues = [
      issue({ id: "PSR-80" }),
      issue({ id: "PSR-81", title: "[riwayat] Add history DTOs", parentId: "PSR-80" }),
      issue({ id: "PSR-82", title: "[docs] Ship roadmap template", labels: ["docs"], projectMilestone: null }),
    ];

    // Act
    const violations = auditIssues(issues, [{ id: "m8", completed: false }]);

    // Assert
    expect(violations).toEqual([]);
  });

  it("flags title, label, and milestone violations", () => {
    // Arrange
    const issues = [
      issue({ id: "PSR-90", title: "Ship history screens without prefix" }),
      issue({ id: "PSR-91", title: "[riwayat] " + "x".repeat(60), labels: ["feature", "bug"] }),
      issue({ id: "PSR-92", title: "[riwayat] Build list UI", projectMilestone: null }),
    ];

    // Act
    const violations = auditIssues(issues, []);

    // Assert
    expect(violations.some((v) => v.startsWith("PSR-90: title"))).toBe(true);
    expect(violations.some((v) => v.includes("exactly one type label"))).toBe(true);
    expect(violations.some((v) => v.startsWith("PSR-92:"))).toBe(true);
  });

  it("flags oversized milestones, parents, and too many open milestones", () => {
    // Arrange
    const issues = Array.from({ length: 11 }, (_, i) =>
      issue({ id: `PSR-${100 + i}`, title: `[riwayat] Build part ${i}`, parentId: "PSR-80" }),
    );
    const milestones = [
      { id: "m7", completed: false },
      { id: "m8", completed: false },
      { id: "m9", completed: false },
    ];

    // Act
    const violations = auditIssues(issues, milestones);

    // Assert
    expect(violations.some((v) => v.includes("exceeds 10"))).toBe(true);
    expect(violations.some((v) => v.includes("open milestones"))).toBe(true);
  });
});
