import type { CameraDevice } from "@/features/member/types";
import type {
  AthleteProfile,
  CoachProfile,
  Profile,
  ProfileRole,
} from "@/features/profile/types";

export const dummyAthleteProfile: AthleteProfile = {
  role: "member",
  name: "Aced Suryana",
  handle: "@aced_suryana",
  nim: "2307051",
  email: "aced.suryana@student.unsil.ac.id",
  roleLabel: "Pesilat Binaan (Anggota Pemula)",
  division: "UKM Pencak Silat Universitas Siliwangi",
  beltLabel: "Sabuk Kuning (Ragam 2)",
  beltTargetLabel: "Target Evaluasi: Sabuk Hijau (Q3 2025)",
  avgAccuracyPct: 91.4,
  accuracyNote: "Optimal",
  totalSessionsLabel: "48 Sesi",
  totalPosturesLabel: "1,240 Postur",
  cameraDeviceLabel: "FaceTime HD Camera (Ultra Wide …)",
  passwordUpdatedLabel: "Terakhir diperbarui 2 bulan yang lalu",
};

export const dummyCoachProfile: CoachProfile = {
  role: "coach",
  name: "Kang Fauzan",
  handle: "@kang_fauzan",
  email: "fauzan@unsil.ac.id",
  titleLabel: "Pelatih Kepala UKM",
  division: "UKM Pencak Silat Universitas Siliwangi",
  teamAccuracyPct: 84.6,
  coachedSessionsLabel: "24 Sesi",
  cameraDeviceLabel: "FaceTime HD Camera (Ultra Wide …)",
  passwordUpdatedLabel: "Terakhir diperbarui 2 bulan yang lalu",
};

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

export function dummyProfileForRole(role: ProfileRole): Profile | null {
  if (role === "coach") return dummyCoachProfile;
  if (role === "member") return dummyAthleteProfile;
  return null;
}
