import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { HeroSection } from '@/components/marketing/hero-section';
import { SocialProofSection } from '@/components/marketing/social-proof-section';
import { PainSection } from '@/components/marketing/pain-section';
import { SolutionSection } from '@/components/marketing/solution-section';
import CombinedFeaturedSection from '@/components/ui/combined-featured-section';
import { IntegrationSection } from '@/components/marketing/integration-section';
import { HowItWorksSection } from '@/components/marketing/how-it-works-section';
import { TrustSection } from '@/components/marketing/trust-section';
import { CTASection } from '@/components/marketing/cta-section';

export default async function MarketingPage() {
  const { userId } = await auth();

  // Redirect authenticated users to dashboard
  if (userId) {
    redirect('/dashboard');
  }

  return (
    <main className="relative bg-background">
      <HeroSection />
      <SocialProofSection />
      <PainSection />
      <SolutionSection />
      <CombinedFeaturedSection />
      <IntegrationSection />
      <HowItWorksSection />
      <TrustSection />
      <CTASection />
    </main>
  );
}
