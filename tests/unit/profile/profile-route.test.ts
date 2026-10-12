import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

describe("profil route wiring", () => {
  it("renders ProfilePage role=member inside MemberLayout with the Profil trail", () => {
    // Arrange + Act
    const page = read("app/(member)/profil/page.tsx");
    const layout = read("app/(member)/profil/layout.tsx");

    // Assert
    expect(page).toContain('role="member"');
    expect(page).toContain("ProfilePage");
    expect(layout).toContain('activeTab="profil"');
    expect(layout).toContain('"Profil"');
  });

  it("enables the Profil tab in the member bottom nav", () => {
    // Arrange + Act
    const src = read("features/member/components/member-bottom-nav.tsx");

    // Assert
    expect(src).toContain('"profil"');
    expect(src).toContain('href="/profil"');
    expect(src).not.toContain("TODO: link to /profil");
  });
});
