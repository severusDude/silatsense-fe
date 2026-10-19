import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dummyMemberDetail } from "@/features/coach/data/member-detail-dummy";
import { performanceBadgeLabel, performanceBadgeVariant } from "@/components/shared/silat-reference";

const getSource = readFileSync("features/coach/data/get-member-detail.ts", "utf8");

describe("dummyMemberDetail", () => {
  it("pins the Aced Suryana detail with Figma scores and no initials field", () => {
    // Arrange + Act
    const detail = dummyMemberDetail["aced-suryana"];

    // Assert
    expect(detail.name).toBe("Aced Suryana");
    expect(detail.nim).toBe("2307051");
    expect(detail).not.toHaveProperty("initials");
    expect(detail.aggregatePct).toBe(82.4);
    expect(detail.pilares.map((p) => [p.slug, p.scorePct])).toEqual([
      ["kuda-kuda", 82],
      ["pukulan", 82],
      ["tangkisan", 86],
      ["tendangan", 78],
    ]);
  });

  it("covers five posture params with siku-kanan not Sesuai", () => {
    // Arrange + Act
    const rows = dummyMemberDetail["aced-suryana"].evaluation.postures.map((p) => [p.id, p.badgeKey]);

    // Assert
    expect(rows).toEqual([
      ["bahu", "sesuai"],
      ["siku-kanan", "tidak-sesuai"],
      ["pinggul", "sesuai"],
      ["lutut", "sesuai"],
      ["pergelangan", "remediasi"],
    ]);
  });

  it("covers four history sessions newest-first with bare badge keys", () => {
    // Arrange + Act
    const rows = dummyMemberDetail["aced-suryana"].history.map((h) => [h.id, h.scorePct, h.badgeKey]);

    // Assert
    expect(rows).toEqual([
      ["sesi-24", 80, "remediasi"],
      ["sesi-23", 88, "sesuai"],
      ["sesi-22", 91, "sesuai"],
      ["sesi-21", 70, "tidak-sesuai"],
    ]);
  });

  it("derives every badge label from its key with no label strings stored", () => {
    // Arrange + Act
    const raw = JSON.stringify(dummyMemberDetail["aced-suryana"]);

    // Assert
    expect(performanceBadgeLabel("remediasi")).toBe("Remediasi");
    expect(performanceBadgeVariant("tidak-sesuai")).toBe("destructive");
    expect(raw).not.toContain("Perlu Poles");
    expect(raw).not.toContain("Perlu Perbaikan");
    expect(raw).not.toContain("Tahap Remediasi");
  });
});

describe("getMemberDetail source", () => {
  it("guards the dummy lookup against prototype keys", () => {
    // Arrange + Act + Assert
    expect(getSource).toContain("Object.hasOwn(dummyMemberDetail, id)");
  });
});
