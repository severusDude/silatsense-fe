import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  memberPasswordApiV1MemberPasswordPatch,
  updateMemberProfileApiV1MemberProfilePatch,
} from "@/api";
import { getAccessToken } from "@/features/auth/data/session";
import { changePasswordAction } from "@/features/profile/actions/change-password";
import { updateProfileAction } from "@/features/profile/actions/update-profile";

vi.mock("@/api", () => ({
  updateMemberProfileApiV1MemberProfilePatch: vi.fn(),
  memberPasswordApiV1MemberPasswordPatch: vi.fn(),
}));

vi.mock("@/features/auth/data/session", () => ({
  getAccessToken: vi.fn(),
}));

describe("updateProfileAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fails early on invalid payload without touching the network", async () => {
    const result = await updateProfileAction({ name: "A" });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("VALIDATION_ERROR");
      expect(result.error.fieldErrors?.name).toBeDefined();
    }
    expect(updateMemberProfileApiV1MemberProfilePatch).not.toHaveBeenCalled();
  });

  it("returns UNAUTHORIZED when session token is missing", async () => {
    vi.mocked(getAccessToken).mockResolvedValue(undefined);

    const result = await updateProfileAction({ name: "Aced Suryana" });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("UNAUTHORIZED");
    }
    expect(updateMemberProfileApiV1MemberProfilePatch).not.toHaveBeenCalled();
  });

  it("calls SDK patch with Bearer token and returns updated profile", async () => {
    vi.mocked(getAccessToken).mockResolvedValue("mock-jwt-token");
    const mockProfileOut = {
      id: "usr-1",
      role: "member" as const,
      fullName: "Aced Suryana Updated",
      npm: "2307051",
      email: "aced@student.unsil.ac.id",
      emailVerifiedAt: null,
      division: "UKM Silat",
      title: null,
      belt: null,
      beltTarget: null,
      passwordChangedAt: null,
      coach: null,
      createdAt: "2026-01-01T00:00:00Z",
      statistics: null,
    };

    vi.mocked(updateMemberProfileApiV1MemberProfilePatch).mockResolvedValue({
      data: mockProfileOut,
      error: undefined,
      response: new Response(JSON.stringify(mockProfileOut), { status: 200 }),
    });

    const result = await updateProfileAction({ name: "Aced Suryana Updated" });

    expect(updateMemberProfileApiV1MemberProfilePatch).toHaveBeenCalledWith({
      headers: {
        Authorization: "Bearer mock-jwt-token",
      },
      body: {
        fullName: "Aced Suryana Updated",
      },
      throwOnError: false,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.fullName).toBe("Aced Suryana Updated");
    }
  });

  it("handles backend API error gracefully", async () => {
    vi.mocked(getAccessToken).mockResolvedValue("mock-jwt-token");
    vi.mocked(updateMemberProfileApiV1MemberProfilePatch).mockResolvedValue({
      data: undefined,
      error: { detail: "Gagal memperbarui profil", code: "UPDATE_FAILED", requestId: "req-1" },
      response: new Response(null, { status: 400 }),
    });

    const result = await updateProfileAction({ name: "Aced Suryana" });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toBe("Gagal memperbarui profil");
    }
  });
});

describe("changePasswordAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fails if new password matches current password", async () => {
    const result = await changePasswordAction({
      currentPassword: "OldPassword123!",
      newPassword: "OldPassword123!",
      confirmPassword: "OldPassword123!",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("VALIDATION_ERROR");
      expect(result.error.fieldErrors?.newPassword).toContain("harus berbeda");
    }
    expect(memberPasswordApiV1MemberPasswordPatch).not.toHaveBeenCalled();
  });

  it("fails if confirm password does not match new password", async () => {
    const result = await changePasswordAction({
      currentPassword: "OldPassword123!",
      newPassword: "NewPassword123!",
      confirmPassword: "DifferentPassword123!",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("VALIDATION_ERROR");
      expect(result.error.fieldErrors?.confirmPassword).toContain("tidak cocok");
    }
    expect(memberPasswordApiV1MemberPasswordPatch).not.toHaveBeenCalled();
  });

  it("returns UNAUTHORIZED if session token is missing", async () => {
    vi.mocked(getAccessToken).mockResolvedValue(undefined);

    const result = await changePasswordAction({
      currentPassword: "OldPassword123!",
      newPassword: "NewPassword123!",
      confirmPassword: "NewPassword123!",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("UNAUTHORIZED");
    }
  });

  it("calls member password patch endpoint and returns success", async () => {
    vi.mocked(getAccessToken).mockResolvedValue("mock-jwt-token");
    vi.mocked(memberPasswordApiV1MemberPasswordPatch).mockResolvedValue({
      data: undefined,
      error: undefined,
      response: new Response(null, { status: 204 }),
    });

    const result = await changePasswordAction({
      currentPassword: "OldPassword123!",
      newPassword: "NewPassword123!",
      confirmPassword: "NewPassword123!",
    });

    expect(memberPasswordApiV1MemberPasswordPatch).toHaveBeenCalledWith({
      headers: {
        Authorization: "Bearer mock-jwt-token",
      },
      body: {
        currentPassword: "OldPassword123!",
        newPassword: "NewPassword123!",
      },
      throwOnError: false,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.success).toBe(true);
    }
  });

  it("handles invalid current password error from backend", async () => {
    vi.mocked(getAccessToken).mockResolvedValue("mock-jwt-token");
    vi.mocked(memberPasswordApiV1MemberPasswordPatch).mockResolvedValue({
      data: undefined,
      error: { detail: "Kata sandi saat ini salah", code: "INVALID_CREDENTIALS", requestId: "req-2" },
      response: new Response(null, { status: 401 }),
    });

    const result = await changePasswordAction({
      currentPassword: "WrongPassword123!",
      newPassword: "NewPassword123!",
      confirmPassword: "NewPassword123!",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toBe("Kata sandi saat ini salah");
    }
  });
});
