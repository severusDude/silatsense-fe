import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

describe("profil route wiring", () => {
  it("renders ProfilePage with session-resolved role inside role-switching layout", () => {
    // Arrange + Act
    const page = read("app/profil/page.tsx");
    const layout = read("app/profil/layout.tsx");
    const error = read("app/profil/error.tsx");

    // Assert
    expect(page).toContain("requireSession");
    expect(page).toContain("<ProfilePage role={user.role} />");
    expect(page).toContain("<Suspense fallback={null}>");

    expect(layout).toContain("requireSession");
    expect(layout).toContain('user.role === "coach"');
    expect(layout).toContain("<CoachLayout activeTab=\"profil\" trail={[\"Dashboard\", \"Profil\"]}>");
    expect(layout).toContain("<MemberLayout activeTab=\"profil\" trail={[\"Dashboard\", \"Profil\"]}>");
    expect(layout).toContain("<Suspense fallback={null}>");

    expect(error).toContain("MemberSegmentFallback as default");
  });

  it("enables the Profil tab in the member bottom nav", () => {
    // Arrange + Act
    const src = read("features/member/components/member-bottom-nav.tsx");

    // Assert
    expect(src).toContain('"profil"');
    expect(src).toContain('href="/profil"');
    expect(src).not.toContain("TODO: link to /profil");
  });

  it("enables the Profil tab in the coach bottom nav", () => {
    // Arrange + Act
    const src = read("features/coach/components/coach-bottom-nav.tsx");

    // Assert
    expect(src).toContain('"profil"');
    expect(src).toContain('href: "/profil"');
  });
});
