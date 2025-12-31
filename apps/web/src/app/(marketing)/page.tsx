import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { HeroSection } from '@/components/marketing/hero-section';
import { PainSection } from '@/components/marketing/pain-section';
import { SolutionSection } from '@/components/marketing/solution-section';
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
      <PainSection />
      <SolutionSection />
      <HowItWorksSection />
      <TrustSection />
      <CTASection />
    </main>
  );
}
