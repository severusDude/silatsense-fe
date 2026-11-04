import { describe, expect, it } from "vitest";
import {
  dummyAthleteProfile,
  dummyCoachProfile,
  dummyProfileCameras,
  dummyProfileForRole,
} from "@/features/profile/data/profile-dummy";

describe("dummyProfileForRole & ProfileViewModel", () => {
  it("carries the member profile mapped to ProfileViewModel with honest metrics", () => {
    // Arrange + Act
    const profile = dummyProfileForRole("member");

    // Assert
    expect(profile).toEqual(dummyAthleteProfile);
    expect(dummyAthleteProfile.name).toBe("Aced Suryana");
    expect(dummyAthleteProfile.initials).toBe("AS");
    expect(dummyAthleteProfile.npm).toBe("2307051");
    expect(dummyAthleteProfile.email).toBe("aced.suryana@student.unsil.ac.id");
    expect(dummyAthleteProfile.beltLabel).toBe("Sabuk Kuning (Ragam 2)");
    expect(dummyAthleteProfile.totalSessionsLabel).toBe("48 Sesi");
    expect(dummyAthleteProfile.accuracyStat.badge).toBe("Coming soon");
    expect(dummyAthleteProfile.postureStat.badge).toBe("Coming soon");
  });

  it("resolves the coach profile and null for an invalid role", () => {
    // Arrange + Act
    const coach = dummyProfileForRole("coach");

    // Assert
    expect(coach).toEqual(dummyCoachProfile);
    expect(dummyCoachProfile.name).toBe("Kang Fauzan");
    expect(dummyCoachProfile.roleLabel).toBe("Pelatih Kepala UKM");
    expect(dummyCoachProfile.accuracyStat.badge).toBe("Coming soon");
    expect(dummyProfileForRole("admin" as never)).toBeNull();
  });

  it("carries two camera devices defaulting to FaceTime HD", () => {
    // Arrange + Act + Assert
    expect(dummyProfileCameras).toHaveLength(2);
    expect(dummyProfileCameras[0].id).toBe("facetime-hd");
    expect(dummyProfileCameras[0].label).toContain("FaceTime HD Camera");
  });
});
