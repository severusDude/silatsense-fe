import { describe, expect, it } from "vitest";
import { filterMembers } from "@/features/coach/components/filter-members";
import { dummyTeamMembers } from "@/features/coach/data/team-members-dummy";

const members = dummyTeamMembers.members;

describe("filterMembers", () => {
  it("returns all members on an empty query", () => {
    // Arrange + Act
    const result = filterMembers(members, "");

    // Assert
    expect(result).toHaveLength(5);
  });

  it("matches names case-insensitively", () => {
    // Arrange + Act
    const result = filterMembers(members, "aced");

    // Assert
    expect(result.map((m) => m.id)).toEqual(["aced-suryana"]);
  });

  it("matches a partial name across members", () => {
    // Arrange + Act
    const result = filterMembers(members, "a");

    // Assert
    expect(result.length).toBeGreaterThan(1);
    expect(result.map((m) => m.id)).toContain("rian-mahendra");
  });

  it("matches an exact NIM", () => {
    // Arrange + Act
    const result = filterMembers(members, "2307053");

    // Assert
    expect(result.map((m) => m.id)).toEqual(["rian-mahendra"]);
  });

  it("matches a shared NIM prefix", () => {
    // Arrange + Act
    const result = filterMembers(members, "230705");

    // Assert
    expect(result).toHaveLength(5);
  });

  it("trims surrounding whitespace before matching", () => {
    // Arrange + Act
    const result = filterMembers(members, "  siti  ");

    // Assert
    expect(result.map((m) => m.id)).toEqual(["siti-nurhaliza"]);
  });

  it("returns an empty list when nothing matches", () => {
    // Arrange + Act
    const result = filterMembers(members, "zzz-999");

    // Assert
    expect(result).toEqual([]);
  });
});
