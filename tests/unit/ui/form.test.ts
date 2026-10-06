import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const uiDir = join(process.cwd(), "components", "ui");
const inputSource = readFileSync(join(uiDir, "input.tsx"), "utf8");
const fieldSource = readFileSync(join(uiDir, "field.tsx"), "utf8");

describe("Input Figma form restyle", () => {
  it("uses 42px height with 12px radius on white surface", () => {
    expect(inputSource).toContain("h-[42px]");
    expect(inputSource).toContain("rounded-xl");
    expect(inputSource).toContain("bg-card");
    expect(inputSource).toContain("border-input");
  });

  it("disables with solid Figma gray instead of opacity fade", () => {
    expect(inputSource).toContain("disabled:bg-input");
    expect(inputSource).toContain("disabled:text-disabled-foreground");
    expect(inputSource).not.toContain("disabled:opacity-50");
  });
});

describe("Field Figma label restyle", () => {
  it("renders labels uppercase Grotesk with wide tracking", () => {
    expect(fieldSource).toContain("font-heading");
    expect(fieldSource).toContain("uppercase");
    expect(fieldSource).toContain("tracking-[0.6px]");
  });

  it("renders helper descriptions at Figma 11px", () => {
    expect(fieldSource).toContain("text-[11px]");
  });
});
