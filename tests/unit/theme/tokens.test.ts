import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const globalsCss = readFileSync(join(root, "app", "globals.css"), "utf8");
const layoutTsx = readFileSync(join(root, "app", "layout.tsx"), "utf8");

function rootBlock(css: string): string {
  const match = css.match(/:root\s*{([^}]*)}/);
  expect(match).not.toBeNull();
  return match![1];
}

function darkBlock(css: string): string {
  const match = css.match(/\.dark\s*{([^}]*)}/);
  expect(match).not.toBeNull();
  return match![1];
}

describe("Figma light tokens in :root", () => {
  it("maps --primary to Deep Red #B42318", () => {
    const root = rootBlock(globalsCss);

    expect(root).toContain("--primary: oklch(0.5003 0.1821 29.51)");
  });

  it("maps --background to Soft Ivory Canvas #F7F7F5", () => {
    const root = rootBlock(globalsCss);

    expect(root).toContain("--background: oklch(0.9756 0.0026 106.45)");
  });

  it("maps --foreground to Solid Charcoal #171717", () => {
    const root = rootBlock(globalsCss);

    expect(root).toContain("--foreground: oklch(0.2046 0 89.88)");
  });

  it("maps --secondary and --muted to Warm Gray #F0F0EC", () => {
    const root = rootBlock(globalsCss);

    expect(root).toContain("--secondary: oklch(0.954 0.0053 106.5)");
    expect(root).toContain("--muted: oklch(0.954 0.0053 106.5)");
  });

  it("maps --border and --input to Soft Crisp Border #E4E4E0", () => {
    const root = rootBlock(globalsCss);

    expect(root).toContain("--border: oklch(0.9177 0.0054 106.5)");
    expect(root).toContain("--input: oklch(0.9177 0.0054 106.5)");
  });

  it("maps --accent to Pale Red Tint with Deep Red foreground", () => {
    const root = rootBlock(globalsCss);

    expect(root).toContain("--accent: oklch(0.9478 0.0199 25.17)");
    expect(root).toContain(
      "--accent-foreground: oklch(0.5003 0.1821 29.51)"
    );
  });

  it("maps --ring and sidebar accents to Deep Red", () => {
    const root = rootBlock(globalsCss);

    expect(root).toContain("--ring: oklch(0.5003 0.1821 29.51)");
    expect(root).toContain(
      "--sidebar-primary: oklch(0.5003 0.1821 29.51)"
    );
  });
});

describe("theme scope boundaries", () => {
  it("leaves .dark on stock neutral tokens (light-only move)", () => {
    const dark = darkBlock(globalsCss);

    expect(dark).toContain("--primary: oklch(0.922 0 0)");
    expect(dark).toContain("--background: oklch(0.145 0 0)");
  });

  it("keeps the radius ramp and font theme bindings", () => {
    expect(globalsCss).toContain("--radius-sm: calc(var(--radius) * 0.6)");
    expect(globalsCss).toContain("--font-heading: var(--font-display)");
  });
});

describe("typography fonts in layout", () => {
  it("loads Space Grotesk display and Plus Jakarta Sans body", () => {
    expect(layoutTsx).toContain("Space_Grotesk");
    expect(layoutTsx).toContain("Plus_Jakarta_Sans");
    expect(layoutTsx).toContain('--font-display');
    expect(layoutTsx).toContain('--font-sans');
  });

  it("contains no Geist font references", () => {
    expect(layoutTsx).not.toContain("Geist");
    expect(layoutTsx).not.toContain("font-geist");
  });
});
