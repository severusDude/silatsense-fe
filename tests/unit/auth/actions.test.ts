import { describe, expect, it } from "vitest";
import { signInPayloadSchema } from "@/features/auth/schemas/sign-in";
import { signUpPayloadSchema } from "@/features/auth/schemas/sign-up";

describe("signInPayloadSchema", () => {
  it("validates and sets default rememberMe to false", () => {
    const res = signInPayloadSchema.safeParse({
      identifier: "227006104",
      password: "password123",
    });
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.rememberMe).toBe(false);
    }
  });

  it("preserves optional next redirect parameter", () => {
    const res = signInPayloadSchema.safeParse({
      identifier: "user@student.unsil.ac.id",
      password: "password123",
      rememberMe: true,
      next: "/riwayat/123",
    });
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.next).toBe("/riwayat/123");
      expect(res.data.rememberMe).toBe(true);
    }
  });

  it("rejects invalid identifier or short password", () => {
    expect(
      signInPayloadSchema.safeParse({
        identifier: "bad",
        password: "password123",
      }).success
    ).toBe(false);

    expect(
      signInPayloadSchema.safeParse({
        identifier: "227006104",
        password: "short",
      }).success
    ).toBe(false);
  });
});

describe("signUpPayloadSchema", () => {
  it("validates clean wire payload without client fields", () => {
    const res = signUpPayloadSchema.safeParse({
      fullName: "Muhammad Fajar",
      identifier: "fajar@student.unsil.ac.id",
      password: "password123",
    });
    expect(res.success).toBe(true);
  });

  it("rejects non-email identifier", () => {
    const res = signUpPayloadSchema.safeParse({
      fullName: "Muhammad Fajar",
      identifier: "227006104",
      password: "password123",
    });
    expect(res.success).toBe(false);
  });
});
