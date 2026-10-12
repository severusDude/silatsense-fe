import type { Metadata } from "next";
import { SignUpPage } from "@/features/auth/pages/sign-up-page";

export const metadata: Metadata = { title: "Daftar — SilatSense" };

export default function Page() {
  return <SignUpPage />;
}
