import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { HeroSection } from '@/components/marketing/hero-section';
import { SocialProofSection } from '@/components/marketing/social-proof-section';
import { PainSection } from '@/components/marketing/pain-section';
import { SolutionSection } from '@/components/marketing/solution-section';
import CombinedFeaturedSection from '@/components/ui/combined-featured-section';
import { IntegrationSection } from '@/components/marketing/integration-section';
import { HowItWorksSection } from '@/components/marketing/how-it-works-section';
import { SuccessStoriesSection } from '@/components/marketing/success-stories-section';
import { CTASection } from '@/components/marketing/cta-section';
import { CalEmbedScript } from '@/components/marketing/cal-embed-script';

export default async function MarketingPage() {
  const { userId } = await auth();

  // Redirect authenticated users to dashboard
  if (userId) {
    redirect('/dashboard');
  }

  return (
    <main className="relative bg-background">
      <CalEmbedScript />
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
