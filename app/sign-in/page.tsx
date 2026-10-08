import type { Metadata } from "next";
import { SignInPage } from "@/features/auth/pages/sign-in-page";

export const metadata: Metadata = { title: "Masuk — SilatSense" };

export default function Page() {
  return <SignInPage />;
}
