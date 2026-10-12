import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const cardSource = readFileSync(
  join(process.cwd(), "components", "ui", "card.tsx"),
  "utf8"
);

describe("Card Figma modular restyle", () => {
  it("uses 22px radius with structural border and soft shadow", () => {
    expect(cardSource).toContain("rounded-[22px]");
    expect(cardSource).toContain("border border-border");
    expect(cardSource).toContain(
      "shadow-[0px_4px_20px_-2px_rgba(0,0,0,0.04),0px_2px_6px_-1px_rgba(0,0,0,0.02)]"
    );
    expect(cardSource).not.toContain("ring-foreground/10");
  });

  it("keeps Grotesk title and muted description", () => {
    expect(cardSource).toContain("font-heading");
    expect(cardSource).toContain("text-muted-foreground");
  });

  it("leaves the footer flat white with a top divider", () => {
    expect(cardSource).toContain("border-t");
    expect(cardSource).not.toContain("bg-muted/50");
  });
});
