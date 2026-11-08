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

  it("renders sessionStat tile dynamically based on availability", () => {
    // Arrange + Act
    const src = athleteSrc();

    // Assert
    expect(src).toContain("profile.sessionStat.isAvailable");
    expect(src).toContain("profile.sessionStat.label");
    expect(src).toContain("profile.sessionStat.value");
    expect(src).toContain("profile.sessionStat.badge");
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

  it("wires Ubah Kata Sandi to ChangePasswordDialog with role forwarding", () => {
    // Arrange + Act
    const src = securitySrc();

    // Assert
    expect(src).toContain("Ubah Kata Sandi");
    expect(src).toContain("ChangePasswordDialog");
    expect(src).toContain("Kata Sandi Akun");
    expect(src).toContain("role={role}");
  });

  it("renders role-aware subtitle and forwards role to security card in ProfilePage", () => {
    // Arrange + Act
    const src = read("features/profile/pages/profile-page.tsx");

    // Assert
    expect(src).toContain('role === "coach"');
    expect(src).toContain("pengaturan keamanan akun pelatih Anda");
    expect(src).toContain("preferensi akun atlet Anda");
    expect(src).toContain("role={role}");
  });
});

describe("profile client islands", () => {
  it("owns form state in the editor via FormProvider and zodResolver with role, title, and division seeded", () => {
    // Arrange + Act
    const src = read("features/profile/components/profile-editor.tsx");

    // Assert
    expect(src).toContain("FormProvider");
    expect(src).toContain("zodResolver(profileSchema)");
    expect(src).toContain("useForm<UpdateProfileInput>");
    expect(src).toContain("role: profile.role");
    expect(src).toContain("title: profile.title");
    expect(src).toContain("division: profile.division");
    expect(src).toContain("profile.role === \"member\"");
    expect(src).not.toContain("Batal");
  });

  it("wires real server action calling updateMemberProfileApiV1MemberProfilePatch and updateCoachProfileApiV1CoachProfilePatch", () => {
    // Arrange + Act
    const src = read("features/profile/actions/update-profile.ts");

    // Assert
    expect(src).toContain("updateProfileSchema.safeParse");
    expect(src).toContain("updateMemberProfileApiV1MemberProfilePatch");
    expect(src).toContain("updateCoachProfileApiV1CoachProfilePatch");
    expect(src).toContain("getAccessToken");
    expect(src).toContain('parsed.data.role === "coach"');
  });

  it("saves with Save icon, invalidates member and coach query keys conditionally, and refreshes router", () => {
    // Arrange + Act
    const src = read("features/profile/components/profile-save-action.tsx");

    // Assert
    expect(src).toContain("Save");
    expect(src).toContain("toast.promise");
    expect(src).toContain("Simpan Perubahan");
    expect(src).toContain("memberProfileApiV1MemberProfileGetQueryKey()");
    expect(src).toContain("coachProfileApiV1CoachProfileGetQueryKey()");
    expect(src).toContain("router.refresh()");
    expect(src).not.toContain("Batal");
  });

  it("renders coach-specific fields and hides NPM when role is coach in biodata form", () => {
    // Arrange + Act
    const src = read("features/profile/components/profile-biodata-form.tsx");

    // Assert
    expect(src).toContain("Jabatan Pelatih");
    expect(src).toContain("Divisi / Perguruan");
    expect(src).toContain("Email Akun Pelatih");
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
