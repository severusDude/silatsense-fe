import { describe, expect, it } from "vitest";

import { buttonVariants } from "@/components/ui/button";

describe("buttonVariants Figma restyle", () => {
  it("renders primary as h-11 rounded-xl with explicit hover", () => {
    const classes = buttonVariants({ variant: "default", size: "default" });

    expect(classes).toContain("h-11");
    expect(classes).toContain("rounded-xl");
    expect(classes).toContain("bg-primary");
    expect(classes).toContain("hover:bg-primary-hover");
    expect(classes).not.toContain("hover:bg-primary/80");
  });

  it("disables with Figma gray fill instead of opacity fade", () => {
    const classes = buttonVariants({ variant: "default", size: "default" });

    expect(classes).toContain("disabled:bg-input");
    expect(classes).toContain("disabled:text-disabled-foreground");
    expect(classes).not.toContain("disabled:opacity-50");
  });

  it("renders outline on white card surface", () => {
    const classes = buttonVariants({ variant: "outline", size: "default" });

    expect(classes).toContain("bg-card");
    expect(classes).toContain("border-border");
  });

  it("renders small size at Figma 34px height", () => {
    const classes = buttonVariants({ variant: "outline", size: "sm" });

    expect(classes).toContain("h-[34px]");
    expect(classes).toContain("rounded-lg");
    expect(classes).toContain("text-xs");
  });
});
