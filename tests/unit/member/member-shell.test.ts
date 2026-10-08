import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

describe("member shell routes", () => {
  it("keeps app routes thin with no client boundary", () => {
    // Arrange + Act
    const layout = read("app/(member)/layout.tsx");
    const page = read("app/(member)/dashboard/page.tsx");

    // Assert
    expect(layout).not.toContain("use client");
    expect(page).not.toContain("use client");
    expect(layout).toContain("@/features/member/pages/");
    expect(page).toContain("@/features/member/pages/");
  });

  it("renders dead nav items with TODOs instead of stub routes", () => {
    // Arrange + Act
    const bottom = read("features/member/components/member-bottom-nav.tsx");
    const top = read("features/member/components/member-top-nav.tsx");

    // Assert
    for (const label of ["Latihan", "Riwayat", "Profil"]) {
      expect(bottom).toContain(label);
    }
    expect(bottom).toContain("aria-disabled");
    expect(bottom).toContain("TODO");
    expect(bottom).toContain("aria-current");
    expect(top).toContain("TODO");
  });

  it("suspends each data section behind a skeleton fallback", () => {
    // Arrange + Act
    const src = read("features/member/pages/dashboard-page.tsx");

    // Assert
    expect(src).toContain("Suspense");
    expect(src).toContain("Skeleton");
    expect(src).toContain("getMemberDashboard");
  });

  it("avoids hard placement in shell components", () => {
    // Arrange + Act
    const files = [
      "features/member/components/member-top-nav.tsx",
      "features/member/components/member-bottom-nav.tsx",
      "features/member/pages/member-layout.tsx",
      "features/member/pages/dashboard-page.tsx",
    ];

    // Assert
    for (const file of files) {
      expect(read(file)).not.toContain("absolute");
    }
  });
});
