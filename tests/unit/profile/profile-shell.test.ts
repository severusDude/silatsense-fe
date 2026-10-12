import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

const athleteSrc = () => read("features/profile/components/profile-athlete-card.tsx");
const securitySrc = () => read("features/profile/components/profile-security-card.tsx");

describe("profile server cards", () => {
  it("renders placeholder avatar with initials and no logout inside the athlete card", () => {
    // Arrange + Act
    const src = athleteSrc();

    // Assert
    expect(src).toContain('role="img"');
    expect(src).toContain("AS");
    expect(src).toContain("Camera");
    expect(src).toContain("TODO");
    expect(src).not.toContain("Logout");
    expect(src).not.toContain("Batal");
  });

  it("keeps server cards flex-only with member copy and coach label swap", () => {
    // Arrange + Act
    const src = athleteSrc();

    // Assert
    expect(src).toContain("Peran & Divisi");
    expect(src).not.toContain("absolute");
    expect(securitySrc()).not.toContain("absolute");
    expect(src).toContain("Pelatih Kepala UKM");
  });

  it("keeps Ubah Kata Sandi a dead stub with a TODO", () => {
    // Arrange + Act
    const src = securitySrc();

    // Assert
    expect(src).toContain("Ubah Kata Sandi");
    expect(src).toContain("TODO");
    expect(src).toContain("Kata Sandi Akun");
  });
});
