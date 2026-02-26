import { HeroSection } from '@/components/marketing/hero-section';
import { SocialProofSection } from '@/components/marketing/social-proof-section';
import { PainSection } from '@/components/marketing/pain-section';
import { SolutionSection } from '@/components/marketing/solution-section-new';
import CombinedFeaturedSection from '@/components/ui/combined-featured-section';
import { IntegrationSection } from '@/components/marketing/integration-section';
import { HowItWorksSection } from '@/components/marketing/how-it-works-section';
import { SuccessStoriesSection } from '@/components/marketing/success-stories-section';
import { CTASection } from '@/components/marketing/cta-section';

export default function MarketingPage() {
  return (
    <main className="relative bg-background">
      <HeroSection />
      <SocialProofSection />
      <PainSection />
      <SolutionSection />
      <CombinedFeaturedSection />
      <IntegrationSection />
      <HowItWorksSection />
      <SuccessStoriesSection />
      <CTASection />
    </main>
  );
}
