import type { ProfileOut } from "@/api";
import type { CameraDevice } from "@/features/member/types";
import { toProfileViewModel } from "@/features/profile/data/profile-mapper";
import type { ProfileRole, ProfileViewModel } from "@/features/profile/types";

export const dummyMemberProfileDto: ProfileOut = {
  id: "dummy-member-1",
  role: "member",
  fullName: "Aced Suryana",
  npm: "2307051",
  email: "aced.suryana@student.unsil.ac.id",
  emailVerifiedAt: "2025-01-01T00:00:00Z",
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

export const dummyCoachProfileDto: ProfileOut = {
  id: "dummy-coach-1",
  role: "coach",
  fullName: "Kang Fauzan",
  npm: null,
  email: "fauzan@unsil.ac.id",
  emailVerifiedAt: "2024-01-01T00:00:00Z",
  division: "UKM Pencak Silat Universitas Siliwangi",
  title: "Pelatih Kepala UKM",
  belt: null,
  beltTarget: null,
  passwordChangedAt: "2026-09-03T00:00:00Z",
  coach: null,
  createdAt: "2024-01-01T00:00:00Z",
  statistics: null,
};

export const dummyAthleteProfile: ProfileViewModel = toProfileViewModel(
  dummyMemberProfileDto,
  { baseDate: new Date("2026-11-03T00:00:00Z") }
);

export const dummyCoachProfile: ProfileViewModel = toProfileViewModel(
  dummyCoachProfileDto,
  { baseDate: new Date("2026-11-03T00:00:00Z") }
);

export const dummyProfileCameras: CameraDevice[] = [
  {
    id: "facetime-hd",
    label: "FaceTime HD Camera (Ultra Wide …)",
    resolution: "1920×1080",
    fps: 30,
    latencyMs: null,
  },
  {
    id: "usb-cam",
    label: "USB Camera 1080p",
    resolution: "1920×1080",
    fps: 30,
    latencyMs: null,
  },
];

export function dummyProfileForRole(role: ProfileRole): ProfileViewModel | null {
  if (role === "coach") return dummyCoachProfile;
  if (role === "member") return dummyAthleteProfile;
  return null;
}
