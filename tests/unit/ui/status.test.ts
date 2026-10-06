import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { alertVariants } from "@/components/ui/alert";
import { badgeVariants } from "@/components/ui/badge";

const root = process.cwd();
const globalsCss = readFileSync(join(root, "app", "globals.css"), "utf8");
const sonnerSource = readFileSync(
  join(root, "components", "ui", "sonner.tsx"),
  "utf8"
);

describe("status tokens in :root", () => {
  it("adds Figma success tints", () => {
    expect(globalsCss).toContain("--success: oklch(0.958 0.0182 155.81)");
    expect(globalsCss).toContain(
      "--success-foreground: oklch(0.5273 0.1378 149.69)"
    );
    expect(globalsCss).toContain(
      "--success-border: oklch(0.925 0.0806 155.99)"
    );
  });

  it("adds Figma warning tints", () => {
    expect(globalsCss).toContain("--warning: oklch(0.9681 0.0409 90.24)");
    expect(globalsCss).toContain(
      "--warning-foreground: oklch(0.4137 0.1054 45.9)"
    );
    expect(globalsCss).toContain(
      "--warning-border: oklch(0.9243 0.1151 95.75)"
    );
  });

  it("exposes status colors to Tailwind", () => {
    expect(globalsCss).toContain("--color-success: var(--success)");
    expect(globalsCss).toContain("--color-warning: var(--warning)");
    expect(globalsCss).toContain(
      "--color-success-foreground: var(--success-foreground)"
    );
  });
});

describe("alertVariants status feedback", () => {
  it("renders success with Figma tint trio", () => {
    const classes = alertVariants({ variant: "success" });

    expect(classes).toContain("bg-success");
    expect(classes).toContain("border-success-border");
    expect(classes).toContain("text-success-foreground");
  });

  it("renders warning with Figma tint trio", () => {
    const classes = alertVariants({ variant: "warning" });

    expect(classes).toContain("bg-warning");
    expect(classes).toContain("border-warning-border");
    expect(classes).toContain("text-warning-foreground");
  });

  it("renders destructive on the pale-red accent surface", () => {
    const classes = alertVariants({ variant: "destructive" });

    expect(classes).toContain("bg-accent");
    expect(classes).toContain("text-destructive");
  });

  it("uses the Figma 16px status radius", () => {
    expect(alertVariants({ variant: "default" })).toContain("rounded-2xl");
  });
});

describe("badgeVariants status pills", () => {
  it("renders success and warning pills from status tokens", () => {
    expect(badgeVariants({ variant: "success" })).toContain("bg-success");
    expect(badgeVariants({ variant: "success" })).toContain(
      "text-success-foreground"
    );
    expect(badgeVariants({ variant: "warning" })).toContain("bg-warning");
    expect(badgeVariants({ variant: "warning" })).toContain(
      "text-warning-foreground"
    );
  });

  it("keeps pills fully rounded", () => {
    expect(badgeVariants({ variant: "success" })).toContain("rounded-full");
  });
});

describe("sonner status tints", () => {
  it("maps toast vars to status tokens", () => {
    expect(sonnerSource).toContain('"--success-bg": "var(--success)"');
    expect(sonnerSource).toContain('"--warning-bg": "var(--warning)"');
    expect(sonnerSource).toContain('"--error-bg": "var(--accent)"');
  });
});
