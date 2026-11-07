import { describe, expect, it } from "vitest";
import type { ProfileOut } from "@/api";
import {
  deriveHandle,
  formatRelativeTime,
  getInitials,
  toProfileViewModel,
} from "@/features/profile/data/profile-mapper";

describe("profile mapper helpers", () => {
  it("extracts initials correctly", () => {
    expect(getInitials("Aced Suryana")).toBe("AS");
    expect(getInitials("Budi")).toBe("BU");
    expect(getInitials("Kang Fauzan")).toBe("KF");
    expect(getInitials("Ahmad Fauzi Rahman")).toBe("AF");
    expect(getInitials("")).toBe("SS");
  });

  it("derives handle from full name", () => {
    expect(deriveHandle("Aced Suryana")).toBe("@aced_suryana");
    expect(deriveHandle("Kang Fauzan")).toBe("@kang_fauzan");
    expect(deriveHandle("Ahmad  Fauzi! ")).toBe("@ahmad_fauzi");
    expect(deriveHandle("")).toBe("@silatsense");
  });

  it("formats relative time in Indonesian with baseDate", () => {
    const baseDate = new Date("2026-11-03T10:00:00Z");

    expect(formatRelativeTime(null, baseDate)).toBe("Belum pernah diperbarui");
    expect(formatRelativeTime(undefined, baseDate)).toBe("Belum pernah diperbarui");
    expect(formatRelativeTime("invalid-date", baseDate)).toBe("Belum pernah diperbarui");

    // 2 months ago (approx 60 days)
    const twoMonthsAgo = new Date("2026-09-03T10:00:00Z").toISOString();
    expect(formatRelativeTime(twoMonthsAgo, baseDate)).toContain("2 bulan yang lalu");

    // Just now
    const justNow = new Date("2026-11-03T09:59:45Z").toISOString();
    expect(formatRelativeTime(justNow, baseDate)).toBe("Baru saja diperbarui");
  });
});

describe("toProfileViewModel", () => {
  const mockMemberDto: ProfileOut = {
    id: "usr-member-123",
    role: "member",
    fullName: "Aced Suryana",
    npm: "2307051",
    email: "aced.suryana@student.unsil.ac.id",
    emailVerifiedAt: "2026-01-01T00:00:00Z",
    division: "UKM Pencak Silat Universitas Siliwangi",
    title: null,
    belt: "Sabuk Kuning (Ragam 2)",
    beltTarget: "Sabuk Hijau (Q3 2025)",
    passwordChangedAt: "2026-09-03T00:00:00Z",
    coach: {
      id: "coach-1",
      fullName: "Kang Fauzan",
      title: "Pelatih Kepala UKM",
    },
    createdAt: "2025-10-01T00:00:00Z",
    statistics: {
      completedSessionCount: 48,
      totalDurationSeconds: 14400,
      durationSampleCount: 48,
      scoredSessionCount: 45,
      excludedScoreCount: 3,
      similarityGroups: [],
    },
  };

  it("maps member ProfileOut to ProfileViewModel with honest active & inactive stats", () => {
    const baseDate = new Date("2026-11-03T00:00:00Z");
    const vm = toProfileViewModel(mockMemberDto, { baseDate });

    expect(vm.id).toBe("usr-member-123");
    expect(vm.role).toBe("member");
    expect(vm.name).toBe("Aced Suryana");
    expect(vm.initials).toBe("AS");
    expect(vm.handle).toBe("@aced_suryana");
    expect(vm.npm).toBe("2307051");
    expect(vm.email).toBe("aced.suryana@student.unsil.ac.id");
    expect(vm.roleLabel).toBe("Pesilat Binaan (Anggota Pemula)");
    expect(vm.division).toBe("UKM Pencak Silat Universitas Siliwangi");
    expect(vm.beltLabel).toBe("Sabuk Kuning (Ragam 2)");
    expect(vm.beltTargetLabel).toBe("Target: Sabuk Hijau (Q3 2025)");
    expect(vm.passwordUpdatedLabel).toContain("bulan yang lalu");

    // Honest stats: active completedSessionCount
    expect(vm.totalSessionsLabel).toBe("48 Sesi");

    // Unsupported stats: flagged as unavailable with Coming soon
    expect(vm.avgAccuracyPct).toBeNull();
    expect(vm.accuracyStat.isAvailable).toBe(false);
    expect(vm.accuracyStat.badge).toBe("Coming soon");
    expect(vm.postureStat.isAvailable).toBe(false);
    expect(vm.postureStat.badge).toBe("Coming soon");
  });

  it("handles nullable fields safely with default fallbacks", () => {
    const sparseDto: ProfileOut = {
      id: "usr-sparse-456",
      role: "member",
      fullName: "Pesilat Baru",
      npm: null,
      email: null,
      emailVerifiedAt: null,
      division: null,
      title: null,
      belt: null,
      beltTarget: null,
      passwordChangedAt: null,
      coach: null,
      createdAt: "2026-11-01T00:00:00Z",
      statistics: null,
    };

    const vm = toProfileViewModel(sparseDto);

    expect(vm.npm).toBe("-");
    expect(vm.email).toBe("Email belum ditautkan");
    expect(vm.division).toBe("UKM Pencak Silat Universitas Siliwangi");
    expect(vm.beltLabel).toBe("Belum ditentukan");
    expect(vm.beltTargetLabel).toBe("Belum ditentukan");
    expect(vm.passwordUpdatedLabel).toBe("Belum pernah diperbarui");
    expect(vm.totalSessionsLabel).toBe("0 Sesi");
  });

  it("maps coach ProfileOut properly", () => {
    const coachDto: ProfileOut = {
      id: "usr-coach-789",
      role: "coach",
      fullName: "Kang Fauzan",
      npm: null,
      email: "fauzan@unsil.ac.id",
      emailVerifiedAt: "2025-01-01T00:00:00Z",
      division: "UKM Pencak Silat Universitas Siliwangi",
      title: "Pelatih Kepala UKM",
      belt: null,
      beltTarget: null,
      passwordChangedAt: "2026-09-03T00:00:00Z",
      coach: null,
      createdAt: "2024-01-01T00:00:00Z",
      statistics: null,
    };

    const vm = toProfileViewModel(coachDto);

    expect(vm.role).toBe("coach");
    expect(vm.roleLabel).toBe("Pelatih Kepala UKM");
    expect(vm.initials).toBe("KF");
    expect(vm.accuracyStat.label).toBe("Akurasi Tim");
    expect(vm.accuracyStat.badge).toBe("Coming soon");
    expect(vm.postureStat.label).toBe("Perangkat");
    expect(vm.postureStat.badge).toBe("Coming soon");
  });
});
