import type { TeamMember } from "@/features/coach/types";

export function filterMembers(members: TeamMember[], query: string): TeamMember[] {
  const q = query.trim().toLowerCase();
  if (!q) return members;
  return members.filter((m) => m.name.toLowerCase().includes(q) || m.nim.toLowerCase().includes(q));
}
