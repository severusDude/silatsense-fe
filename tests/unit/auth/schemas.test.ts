import { describe, expect, it } from "vitest";
import { signInSchema, signUpSchema } from "@/features/auth/schemas";

const signInBase = { identifier: "227006104", password: "secretpassword", rememberMe: false };

describe("identifier (NPM/email union on sign-in)", () => {
  it("accepts an 8 to 12 digit NPM", () => {
    expect(signInSchema.safeParse(signInBase).success).toBe(true);
    expect(signInSchema.safeParse({ ...signInBase, identifier: "12345678" }).success).toBe(true);
    expect(signInSchema.safeParse({ ...signInBase, identifier: "123456789012" }).success).toBe(true);
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

  it("rejects identifier longer than 254 characters", () => {
    const tooLongEmail = `${"a".repeat(246)}@unsil.ac.id`;
    expect(tooLongEmail.length).toBeGreaterThan(254);
    expect(signInSchema.safeParse({ ...signInBase, identifier: tooLongEmail }).success).toBe(false);
  });
});

describe("signInSchema password boundaries", () => {
  it("rejects passwords shorter than 8 chars", () => {
    const r = signInSchema.safeParse({ ...signInBase, password: "short" });
    expect(r.success).toBe(false);
  });

  it("accepts password of 128 chars", () => {
    const r = signInSchema.safeParse({ ...signInBase, password: "a".repeat(128) });
    expect(r.success).toBe(true);
  });

  it("rejects password exceeding 128 chars", () => {
    const r = signInSchema.safeParse({ ...signInBase, password: "a".repeat(129) });
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

  it("accepts a complete valid registration with email", () => {
    expect(signUpSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects raw NPM for sign-up (Decision A1: email required)", () => {
    const r = signUpSchema.safeParse({ ...valid, identifier: "227006104" });
    expect(r.success).toBe(false);
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

  it("rejects a name exceeding 120 chars", () => {
    const r = signUpSchema.safeParse({ ...valid, fullName: "A".repeat(121) });
    expect(r.success).toBe(false);
  });

  it("accepts a name up to 120 chars", () => {
    const r = signUpSchema.safeParse({ ...valid, fullName: "A".repeat(120) });
    expect(r.success).toBe(true);
  });
});
