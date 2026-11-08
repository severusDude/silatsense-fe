import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const statGrid = readFileSync("features/coach/components/member-stat-grid.tsx", "utf8");
const cardList = readFileSync("features/coach/components/member-card-list.tsx", "utf8");

describe("member sections", () => {
  it("renders the member stat grid with four icons and honest UI note/badges", () => {
    // Arrange + Act + Assert
    expect(statGrid).toContain("Statistik binaan");
    expect(statGrid).toContain("Users");
    expect(statGrid).toContain("Target");
    expect(statGrid).toContain("CircleCheckBig");
    expect(statGrid).toContain("Video");
    expect(statGrid).toContain('size="sm"');
    expect(statGrid).not.toContain("CardFooter");
    expect(statGrid).not.toContain("footerLeft");
    expect(statGrid).not.toContain("absolute");
  });

  it("renders the member card list with full Card composition, cursor links, and ghost CTAs", () => {
    // Arrange + Act + Assert
    expect(cardList).toContain("Monitoring Pose Kinematika");
    expect(cardList).toContain("{countLabel}");
    expect(cardList).toContain("<section");
    expect(cardList).toContain("<h2");
    expect(cardList).toContain("<CardHeader");
    expect(cardList).toContain("<CardTitle");
    expect(cardList).toContain("<CardAction");
    expect(cardList).toContain("<CardFooter");
    expect(cardList).not.toContain('"gap-0"');
    expect(cardList).toContain("buttonVariants");
    expect(cardList).toContain('variant: "ghost"');
    expect(cardList).toContain("Lihat Detail");
    expect(cardList).toContain("member.detailHref");
    expect(cardList).toContain("Tidak ada atlet yang cocok");
    expect(cardList).toContain("member.statusVariant");
    expect(cardList).toContain("member.scoreLabel");
    expect(cardList).toContain("Muat Lebih Banyak");
    expect(cardList).toContain("Kembali ke Awal");
    expect(cardList).toContain('role="img"');
  });

  it("keeps pills on Badge and graphics on lucide only", () => {
    // Arrange + Act + Assert
    expect(cardList).toContain("Badge");
    expect(cardList).toContain("lucide-react");
    expect(cardList).not.toContain("MediaPipe");
    expect(cardList).not.toContain("Elevasi Siku");
    expect(cardList).not.toContain("absolute");
    expect(statGrid).not.toContain("MediaPipe");
  });
});
