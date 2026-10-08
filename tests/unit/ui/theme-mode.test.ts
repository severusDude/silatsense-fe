import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const providersSource = readFileSync(
  join(root, "app", "providers.tsx"),
  "utf8"
);

describe("light-only theme mode", () => {
  it("forces the light theme and ignores the OS setting", () => {
    expect(providersSource).toContain('defaultTheme="light"');
    expect(providersSource).toContain("enableSystem={false}");
    expect(providersSource).not.toContain('defaultTheme="system"');
  });

  it("pins light so dark can never apply until PSR-22", () => {
    expect(providersSource).toContain('forcedTheme="light"');
    expect(providersSource).toContain("PSR-22");
  });
});
