// TODO(desktop): revisit responsive grid — mobile-only max-w-[448px] for now.
import { AnalisisSection } from "@/features/landing/components/analisis-section";
import { CtaBanner } from "@/features/landing/components/cta-banner";
import { FaqSection } from "@/features/landing/components/faq-section";
import { HeroSection } from "@/features/landing/components/hero-section";
import { LangkahSection } from "@/features/landing/components/langkah-section";
import { PilarGrid } from "@/features/landing/components/pilar-grid";
import { SiteFooter } from "@/features/landing/components/site-footer";
import { SiteHeader } from "@/features/landing/components/site-header";
import { WhySection } from "@/features/landing/components/why-section";

export function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-[448px] flex-1 flex-col gap-9 px-4 pt-4 pb-24">
        <HeroSection />
        <PilarGrid />
        <AnalisisSection />
        <LangkahSection />
        <WhySection />
        <FaqSection />
        <CtaBanner />
        <SiteFooter />
      </main>
    </div>
  );
}
