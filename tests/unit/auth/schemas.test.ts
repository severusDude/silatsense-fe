import { describe, expect, it } from "vitest";
import { signInSchema, signUpSchema } from "@/features/auth/schemas";

const signInBase = { identifier: "227006104", password: "secretpassword", rememberMe: false };

describe("identifier (NPM/email union)", () => {
  it("accepts a 9-digit NPM", () => {
    expect(signInSchema.safeParse(signInBase).success).toBe(true);
  });

  it("accepts a student email", () => {
    const r = signInSchema.safeParse({ ...signInBase, identifier: "npm@student.unsil.ac.id" });
    expect(r.success).toBe(true);
  });

  it("rejects a 3-char string that is neither NPM nor email", () => {
    const r = signInSchema.safeParse({ ...signInBase, identifier: "abc" });
    expect(r.success).toBe(false);
  });

  it("rejects a 7-digit number (too short for NPM, not an email)", () => {
    const r = signInSchema.safeParse({ ...signInBase, identifier: "1234567" });
    expect(r.success).toBe(false);
  });
});

describe("signInSchema password", () => {
  it("rejects passwords shorter than 8 chars", () => {
    const r = signInSchema.safeParse({ ...signInBase, password: "short" });
    expect(r.success).toBe(false);
  });
});

describe("signUpSchema", () => {
  const valid = {
    fullName: "Muhammad Fajar Nugraha",
    identifier: "npm@student.unsil.ac.id",
    password: "password123",
    confirmPassword: "password123",
    terms: true,
  };

  it("accepts a complete valid registration", () => {
    expect(signUpSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects mismatched confirmation on confirmPassword", () => {
    const r = signUpSchema.safeParse({ ...valid, confirmPassword: "different99" });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues[0]?.path).toEqual(["confirmPassword"]);
    }
  });

  it("rejects unchecked terms", () => {
    const r = signUpSchema.safeParse({ ...valid, terms: false });
    expect(r.success).toBe(false);
  });

  it("rejects a 2-char name", () => {
    const r = signUpSchema.safeParse({ ...valid, fullName: "Ab" });
    expect(r.success).toBe(false);
  });
});
