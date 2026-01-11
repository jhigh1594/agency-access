import type { Metadata } from 'next';
import { PricingHero } from '@/components/marketing/pricing/pricing-hero';
import { SavingsCalculator } from '@/components/marketing/pricing/savings-calculator';
import { PricingTiers } from '@/components/marketing/pricing/pricing-tiers';
import { MetricBanner } from '@/components/marketing/pricing/metric-banner';
import { TestimonialCards } from '@/components/marketing/pricing/testimonial-cards';
import { CaseStudyFeature } from '@/components/marketing/pricing/case-study-feature';
import { FAQSection } from '@/components/marketing/pricing/faq-section';
import { FinalCTASection } from '@/components/marketing/pricing/final-cta-section';

export const metadata: Metadata = {
  title: 'Pricing | Agency Access Platform',
  description: 'Simple, transparent pricing for marketing agencies. Choose the plan that fits your client volume and scale your onboarding process.',
  openGraph: {
    title: 'Pricing | Agency Access Platform',
    description: 'Simple, transparent pricing for marketing agencies.',
    type: 'website',
  },
};

export default async function PricingPage() {
  return (
    <main className="relative bg-background">
      <PricingHero />
      <SavingsCalculator />
      <PricingTiers />
      <MetricBanner />
      <TestimonialCards />
      <CaseStudyFeature />
      <FAQSection />
      <FinalCTASection />
    </main>
  );
}
