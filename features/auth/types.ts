export type { AuthTokens, AuthUser, SignIn, SignUp } from "@/api";

export type ActionResult<T> =
  | { ok: true; data: T }
  | {
      ok: false;
      error: {
        message: string;
        code?: string;
        fieldErrors?: Record<string, string>;
      };
    };

export type AuthSuccessResult = {
  user: import("@/api").AuthUser;
  redirectTo: string;
};
