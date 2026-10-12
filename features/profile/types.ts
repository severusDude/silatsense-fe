export type ProfileRole = "member" | "coach";

export interface AthleteProfile {
  role: "member";
  name: string;
  handle: string;
  nim: string;
  email: string;
  roleLabel: string;
  division: string;
  beltLabel: string;
  beltTargetLabel: string;
  avgAccuracyPct: number;
  accuracyNote: string;
  totalSessionsLabel: string;
  totalPosturesLabel: string;
  cameraDeviceLabel: string;
  passwordUpdatedLabel: string;
}

export interface CoachProfile {
  role: "coach";
  name: string;
  handle: string;
  email: string;
  titleLabel: string;
  division: string;
  teamAccuracyPct: number;
  coachedSessionsLabel: string;
  cameraDeviceLabel: string;
  passwordUpdatedLabel: string;
}

export type Profile = AthleteProfile | CoachProfile;

export interface UpdateProfileInput {
  name: string;
  nim: string;
  email: string;
  cameraDeviceId: string;
}
