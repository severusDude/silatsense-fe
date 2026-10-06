import { describe, expect, it } from "vitest";

import { demoSchema } from "@/lib/schemas";

describe("demoSchema", () => {
  it("accepts a valid name and email", () => {
    const result = demoSchema.safeParse({
      name: "Pendekar Kilat",
      email: "pendekar@silatsense.id",
    });

    expect(result.success).toBe(true);
  });

  it("rejects a name shorter than 3 characters", () => {
    const result = demoSchema.safeParse({ name: "ab", email: "a@b.id" });

    expect(result.success).toBe(false);
  });
});
