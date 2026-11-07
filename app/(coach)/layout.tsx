import { Suspense, type ReactNode } from "react";
import { AuthGate } from "@/features/auth/components/auth-gate";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={null}>
      <AuthGate role="coach">{children}</AuthGate>
    </Suspense>
  );
}
