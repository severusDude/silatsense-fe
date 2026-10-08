import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

describe("auth stub endpoints (§4a: TODO names the exact endpoint)", () => {
  it("points the sign-in stub at POST /auth/sign-in", () => {
    const src = read("features/auth/components/sign-in-form.tsx");

    expect(src).toContain("TODO: connect backend via lib/api-client.ts (POST /auth/sign-in)");
    expect(src).not.toContain("no REST contract yet");
  });

  it("points the sign-up stub at POST /auth/sign-up", () => {
    const src = read("features/auth/components/sign-up-form.tsx");

    expect(src).toContain("TODO: connect backend via lib/api-client.ts (POST /auth/sign-up)");
    expect(src).not.toContain("no REST contract yet");
  });

  it("types both mutations with their response DTOs", () => {
    expect(read("features/auth/components/sign-in-form.tsx")).toContain(
      "useMutation<SignInResponse, Error, SignInInput>"
    );
    expect(read("features/auth/components/sign-up-form.tsx")).toContain(
      "useMutation<SignUpResponse, Error, SignUpInput>"
    );
  });
});

describe("auth DTOs (§4a: contract pinned in types)", () => {
  it("declares request/response pairs plus the session user", () => {
    const src = read("features/auth/types.ts");

    for (const name of [
      "interface AuthUser",
      "interface SignInRequest",
      "interface SignInResponse",
      "interface SignUpRequest",
      "interface SignUpResponse",
    ]) {
      expect(src).toContain(name);
    }
    expect(src).toContain("accessToken");
    expect(src).toContain("expiresIn");
  });

  it("keeps client-only fields out of the request DTOs", () => {
    const src = read("features/auth/types.ts");
    const requestBlock = src.slice(src.indexOf("interface SignInRequest"), src.indexOf("interface SignUpResponse"));

    expect(requestBlock).not.toContain("confirmPassword");
    expect(requestBlock).not.toContain("terms");
  });
});
