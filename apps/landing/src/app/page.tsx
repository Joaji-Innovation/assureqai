import '@/app/landing.css';
import { Navbar } from '@/components/landing/Navbar';
import { HeroSection } from '@/components/landing/HeroSection';
import { FeaturesSection } from '@/components/landing/FeaturesSection';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { IndustriesSection } from '@/components/landing/IndustriesSection';
import { TestimonialsSection } from '@/components/landing/TestimonialsSection';
import { PricingSection } from '@/components/landing/PricingSection';
import { FAQSection } from '@/components/landing/FAQSection';
import { LogoTicker } from '@/components/landing/LogoTicker';
import { CTASection } from '@/components/landing/CTASection';
import { Spotlight } from '@/components/landing/Spotlight';

export default function HomePage() {
  return (
    <div className="landing-page-theme min-h-screen bg-white dark:bg-black font-sans selection:bg-primary/30">
        <Spotlight>
          <Navbar />
          <main className="flex-1 flex flex-col">
            <HeroSection />
            <LogoTicker />
            <FeaturesSection />
            <HowItWorksSection />
            <IndustriesSection />
            <TestimonialsSection />
            <PricingSection />
            <FAQSection />
            <CTASection />
          </main>
        </Spotlight>
    </div>
  );
}
