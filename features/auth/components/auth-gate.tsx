import type { ReactNode } from "react";
import { requireRole } from "@/features/auth/data/session";

type AuthGateProps = {
  role: "member" | "coach";
  children: ReactNode;
};

export async function AuthGate({ role, children }: AuthGateProps) {
  await requireRole(role);
  return <>{children}</>;
}
