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

describe("profile client islands", () => {
  it("owns form state in the editor via FormProvider and zodResolver", () => {
    // Arrange + Act
    const src = read("features/profile/components/profile-editor.tsx");

    // Assert
    expect(src).toContain("FormProvider");
    expect(src).toContain("zodResolver(profileSchema)");
    expect(src).toContain("useForm<UpdateProfileInput>");
    expect(src).not.toContain("Batal");
  });

  it("validates the stub update at the server-action boundary with PATCH TODO", () => {
    // Arrange + Act
    const src = read("features/profile/actions/update-profile.ts");

    // Assert
    expect(src).toContain("profileSchema.parse");
    expect(src).toContain("PATCH /member/profile");
    expect(src).toContain("TODO");
  });

  it("saves once with the Save icon over toast.promise and invalidates the profile key", () => {
    // Arrange + Act
    const src = read("features/profile/components/profile-save-action.tsx");

    // Assert
    expect(src).toContain("Save");
    expect(src).toContain("toast.promise");
    expect(src).toContain("Simpan Perubahan");
    expect(src).toContain('["profile"]');
    expect(src).not.toContain("Batal");
  });

  it("logs out via a non-primary outline button with a sign-out TODO", () => {
    // Arrange + Act
    const src = read("features/profile/components/profile-logout-button.tsx");

    // Assert
    expect(src).toContain("LogOut");
    expect(src).toContain('variant="outline"');
    expect(src).toContain("TODO");
    expect(src).toContain("Logout");
  });

  it("keeps every client island free of absolute positioning", () => {
    // Arrange + Act + Assert
    for (const file of [
      "features/profile/components/profile-editor.tsx",
      "features/profile/components/profile-biodata-form.tsx",
      "features/profile/components/profile-camera-card.tsx",
      "features/profile/components/profile-save-action.tsx",
      "features/profile/components/profile-logout-button.tsx",
    ]) {
      expect(read(file)).not.toContain("absolute");
    }
  });
});
