import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

describe("auth forms wired to server actions", () => {
  it("wires sign-in form to signInAction", () => {
    const src = read("features/auth/components/sign-in-form.tsx");

    expect(src).toContain("signInAction");
    expect(src).not.toContain("Backend belum tersambung");
  });

  it("wires sign-up form to signUpAction", () => {
    const src = read("features/auth/components/sign-up-form.tsx");

    expect(src).toContain("signUpAction");
    expect(src).not.toContain("Backend belum tersambung");
  });

  it("strips client-only fields before calling signUpAction", () => {
    const src = read("features/auth/components/sign-up-form.tsx");

    expect(src).toContain("fullName: values.fullName");
    expect(src).toContain("identifier: values.identifier");
    expect(src).toContain("password: values.password");
    expect(src).not.toContain("confirmPassword: values.confirmPassword");
    expect(src).toContain("signUpAction(payload)");
  });
});

describe("auth wire types from generated client", () => {
  it("re-exports wire types from @/api", () => {
    const src = read("features/auth/types.ts");

    expect(src).toContain('from "@/api"');
    expect(src).toContain("AuthTokens");
    expect(src).toContain("AuthUser");
    expect(src).toContain("ActionResult");
  });
});
