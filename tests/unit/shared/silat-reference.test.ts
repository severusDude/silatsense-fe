import { describe, expect, it } from "vitest";
import {
  META_BADGE_VARIANT,
  getInitials,
  performanceBadgeLabel,
  performanceBadgeVariant,
} from "@/components/shared/silat-reference";

describe("silat-reference", () => {
  it("derives initials from the first two words", () => {
    // Arrange + Act + Assert
    expect(getInitials("Aced Suryana")).toBe("AS");
    expect(getInitials("Kang Fauzan Azhiim")).toBe("KF");
    expect(getInitials("  siti   nurhaliza  ")).toBe("SN");
    expect(getInitials("Aced")).toBe("AC");
  });

  it("maps each performance key to its single label and variant", () => {
    // Arrange + Act + Assert
    expect([performanceBadgeLabel("sesuai"), performanceBadgeVariant("sesuai")]).toEqual(["Sesuai", "success"]);
    expect([performanceBadgeLabel("remediasi"), performanceBadgeVariant("remediasi")]).toEqual(["Remediasi", "warning"]);
    expect([performanceBadgeLabel("tidak-sesuai"), performanceBadgeVariant("tidak-sesuai")]).toEqual(["Tidak Sesuai", "destructive"]);
    expect([performanceBadgeLabel("evaluasi"), performanceBadgeVariant("evaluasi")]).toEqual(["Evaluasi", "secondary"]);
  });

  it("pins fixed meta slot variants with Standar IPSI on success", () => {
    // Arrange + Act + Assert
    expect(META_BADGE_VARIANT).toEqual({ sesi: "secondary", standar: "success", date: "outline", repetisi: "outline", count: "secondary" });
  });
});
