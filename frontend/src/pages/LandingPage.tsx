import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { HeroSection } from '@/components/sections/HeroSection';
import { FeaturesSection } from '@/components/sections/FeaturesSection';
import { HowItWorksSection } from '@/components/sections/HowItWorksSection';
import { BenefitsSection } from '@/components/sections/BenefitsSection';
import { TestimonialsSection } from '@/components/sections/TestimonialsSection';
import { PricingSection } from '@/components/sections/PricingSection';
import { FAQSection } from '@/components/sections/FAQSection';
import { CTASection } from '@/components/sections/CTASection';

/**
 * Landing Page — the public-facing homepage of StudyOS AI.
 * Assembles all sections in order: Hero → Features → HowItWorks →
 * Testimonials → Pricing → FAQ → CTA → Footer.
 */
export function LandingPage() {
  return (
    <>
      {/* SEO Meta (injected via index.html for Vite) */}
      <Navbar />

      <main id="main-content">
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <BenefitsSection />
        <TestimonialsSection />
        <PricingSection />
        <FAQSection />
        <CTASection />
      </main>

      <Footer />
    </>
  );
}
