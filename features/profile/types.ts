import type {
  CoachProfilePatch,
  MemberProfilePatch,
  PasswordChange,
  ProfileOut,
} from "@/api";
import type { NormalizedApiError } from "@/lib/api-client";

export type ProfileRole = "member" | "coach";

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: NormalizedApiError };

export interface StatItemViewModel {
  isAvailable: boolean;
  label: string;
  value?: string;
  badge?: string;
  note?: string;
}

export interface ProfileViewModel {
  id: string;
  role: ProfileRole;
  name: string;
  initials: string;
  handle: string;
  npm: string;
  email: string;
  title: string;
  roleLabel: string;
  division: string;
  beltLabel: string;
  beltTargetLabel: string;
  passwordUpdatedLabel: string;
  totalSessionsLabel: string;
  avgAccuracyPct: number | null;
  accuracyNote: string | null;
  totalPosturesLabel: string | null;
  teamAccuracyPct: number | null;
  coachedSessionsLabel: string | null;
  sessionStat: StatItemViewModel;
  accuracyStat: StatItemViewModel;
  postureStat: StatItemViewModel;
  raw: ProfileOut;
}

// Backwards-compatible alias for existing imports
export type Profile = ProfileViewModel;

export type { CoachProfilePatch, MemberProfilePatch, PasswordChange, ProfileOut };
