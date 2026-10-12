import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const bottomNav = readFileSync("features/coach/components/coach-bottom-nav.tsx", "utf8");
const topNav = readFileSync("features/coach/components/coach-top-nav.tsx", "utf8");

describe("coach shell", () => {
  it("exposes four tabs with Profil linking to the shared /profil route", () => {
    // Arrange + Act + Assert
    // NOTE (Task 3): brief asserted href="/coach" (equals form), but the
    // data-driven tabs array holds href values as `href: "/coach"` with
    // `<Link href={href}>`, so the equals-form literal never appears.
    // Assert on the route-value substrings instead — same intent.
    expect(bottomNav).toContain('"/coach"');
    expect(bottomNav).toContain('"/coach/members"');
    expect(bottomNav).toContain("Laporan");
    expect(bottomNav).toContain('"/profil"');
  });

  it("shows the KF coach avatar with Cloud Sinkron (no Portal badge in shell)", () => {
    // Arrange + Act + Assert
    expect(topNav).toContain("KF");
    expect(topNav).toContain("Cloud Sinkron");
    expect(topNav).not.toContain("Portal");
  });
});
