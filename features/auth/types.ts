import type { SignInInput, SignUpInput } from "@/features/auth/schemas";

// Expected backend contract (no REST contract yet — §4a stubs).
// Client-only fields (confirmPassword, terms) never leave the browser;
// rememberMe is sent so the backend can issue a long-lived session.

export type MemberRole = "member" | "coach";

export interface AuthUser {
  id: string;
  fullName: string;
  identifier: string;
  role: MemberRole;
}

export interface SignInRequest {
  identifier: SignInInput["identifier"];
  password: string;
  rememberMe: boolean;
}

export interface SignInResponse {
  user: AuthUser;
  accessToken: string;
  expiresIn: number;
}

export interface SignUpRequest {
  fullName: string;
  identifier: SignUpInput["identifier"];
  password: string;
}

export interface SignUpResponse {
  user: AuthUser;
  accessToken: string;
  expiresIn: number;
}
