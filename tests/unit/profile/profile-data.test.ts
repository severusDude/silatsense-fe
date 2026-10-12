import { describe, expect, it } from "vitest";
import {
  dummyAthleteProfile,
  dummyCoachProfile,
  dummyProfileCameras,
  dummyProfileForRole,
} from "@/features/profile/data/profile-dummy";

describe("dummyProfileForRole", () => {
  it("carries the member profile verbatim from Figma 94:41585", () => {
    // Arrange + Act
    const profile = dummyProfileForRole("member");

    // Assert
    expect(profile).toEqual(dummyAthleteProfile);
    expect(dummyAthleteProfile.name).toBe("Aced Suryana");
    expect(dummyAthleteProfile.nim).toBe("2307051");
    expect(dummyAthleteProfile.email).toBe("aced.suryana@student.unsil.ac.id");
    expect(dummyAthleteProfile.beltLabel).toBe("Sabuk Kuning (Ragam 2)");
    expect(dummyAthleteProfile.avgAccuracyPct).toBe(91.4);
    expect(dummyAthleteProfile.accuracyNote).toBe("Optimal");
    expect(dummyAthleteProfile.totalSessionsLabel).toBe("48 Sesi");
    expect(dummyAthleteProfile.totalPosturesLabel).toBe("1,240 Postur");
  });

  it("resolves the coach placeholder and null for an invalid role", () => {
    // Arrange + Act
    const coach = dummyProfileForRole("coach");

    // Assert
    expect(coach).toEqual(dummyCoachProfile);
    expect(dummyCoachProfile.name).toBe("Kang Fauzan");
    expect(dummyCoachProfile.titleLabel).toBe("Pelatih Kepala UKM");
    expect(dummyCoachProfile.teamAccuracyPct).toBe(84.6);
    expect(dummyProfileForRole("admin" as never)).toBeNull();
  });

  it("carries two camera devices defaulting to FaceTime HD", () => {
    // Arrange + Act + Assert
    expect(dummyProfileCameras).toHaveLength(2);
    expect(dummyProfileCameras[0].id).toBe("facetime-hd");
    expect(dummyProfileCameras[0].label).toContain("FaceTime HD Camera");
  });
});
