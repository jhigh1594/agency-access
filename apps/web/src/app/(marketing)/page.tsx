import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { HeroSection } from '@/components/marketing/hero-section';
import { FeaturesSection } from '@/components/marketing/features-section';
import { BenefitsSection } from '@/components/marketing/benefits-section';
import { HowItWorksSection } from '@/components/marketing/how-it-works-section';
import { CTASection } from '@/components/marketing/cta-section';

export default async function MarketingPage() {
  const { userId } = await auth();

  // Redirect authenticated users to dashboard
  if (userId) {
    redirect('/dashboard');
  }

  return (
    <>
      <HeroSection />
      <FeaturesSection />
      <BenefitsSection />
      <HowItWorksSection />
      <CTASection />
    </>
  );
}

