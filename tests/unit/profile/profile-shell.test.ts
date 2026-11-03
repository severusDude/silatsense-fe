import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

const athleteSrc = () =>
  read("features/profile/components/profile-athlete-card.tsx");
const securitySrc = () =>
  read("features/profile/components/profile-security-card.tsx");

describe("profile server cards", () => {
  it("renders avatar with dynamic initials, honest stats and no logout inside athlete card", () => {
    // Arrange + Act
    const src = athleteSrc();

    // Assert
    expect(src).toContain('role="img"');
    expect(src).toContain("profile.initials");
    expect(src).toContain("Coming soon");
    expect(src).toContain("Camera");
    expect(src).toContain("TODO: wire avatar upload");
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

  it("wires Ubah Kata Sandi to ChangePasswordDialog", () => {
    // Arrange + Act
    const src = securitySrc();

    // Assert
    expect(src).toContain("Ubah Kata Sandi");
    expect(src).toContain("ChangePasswordDialog");
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

  it("wires real server action calling updateMemberProfileApiV1MemberProfilePatch", () => {
    // Arrange + Act
    const src = read("features/profile/actions/update-profile.ts");

    // Assert
    expect(src).toContain("updateProfileSchema.safeParse");
    expect(src).toContain("updateMemberProfileApiV1MemberProfilePatch");
    expect(src).toContain("getAccessToken");
  });

  it("saves with Save icon, invalidates generated member query key, and refreshes router", () => {
    // Arrange + Act
    const src = read("features/profile/components/profile-save-action.tsx");

    // Assert
    expect(src).toContain("Save");
    expect(src).toContain("toast.promise");
    expect(src).toContain("Simpan Perubahan");
    expect(src).toContain("memberProfileApiV1MemberProfileGetQueryKey()");
    expect(src).toContain("router.refresh()");
    expect(src).not.toContain("Batal");
  });

  it("keeps NPM and Email read-only with explanatory captions in biodata form", () => {
    // Arrange + Act
    const src = read("features/profile/components/profile-biodata-form.tsx");

    // Assert
    expect(src).toContain("Nomor Induk Mahasiswa terdaftar permanen");
    expect(src).toContain("Ubah email melalui menu verifikasi keamanan akun");
    expect(src).toContain("readOnly");
  });

  it("logs out via a non-primary outline button with a sign-out action", () => {
    // Arrange + Act
    const src = read("features/profile/components/profile-logout-button.tsx");

    // Assert
    expect(src).toContain("LogOut");
    expect(src).toContain('variant="outline"');
    expect(src).toContain("signOutAction");
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
      "features/profile/components/profile-security-card.tsx",
    ]) {
      expect(read(file)).not.toContain("absolute");
    }
  });
});
