import { HeroSection } from '@/components/marketing/hero-section';
import { SocialProofSection } from '@/components/marketing/social-proof-section';
import { PainSection } from '@/components/marketing/pain-section';
import { SolutionSection } from '@/components/marketing/solution-section-new';
import CombinedFeaturedSection from '@/components/ui/combined-featured-section';
import { IntegrationSection } from '@/components/marketing/integration-section';
import { HowItWorksSection } from '@/components/marketing/how-it-works-section';
import { SuccessStoriesSection } from '@/components/marketing/success-stories-section';
import { HomepageFAQSection } from '@/components/marketing/homepage-faq-section';
import { CTASection } from '@/components/marketing/cta-section';

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is AuthHub?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'AuthHub is an automated client OAuth onboarding platform that lets digital agencies send a single branded link so clients can authorize Meta Ads, Google Ads, GA4, LinkedIn, and TikTok in under 5 minutes — replacing days of back-and-forth emails.',
      },
    },
    {
      '@type': 'Question',
      name: 'How does AuthHub handle OAuth token security?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'OAuth tokens are encrypted at rest using Infisical and stored in a SOC 2 Type II certified environment. Tokens auto-refresh before expiration, so access never drops without manual intervention.',
      },
    },
    {
      '@type': 'Question',
      name: 'Which ad platforms does AuthHub support?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'AuthHub currently supports Meta Ads, Google Ads, GA4, LinkedIn Ads, and TikTok, with 30+ email exchanges eliminated per client onboarding.',
      },
    },
    {
      '@type': 'Question',
      name: 'How long does client onboarding take with AuthHub?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Most clients complete authorization in under 5 minutes. Agencies report reducing onboarding from 2–3 days to the same day they send the link.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is AuthHub white-label?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Agencies can add their own logo, brand colors, and custom domain so clients see a consistent, agency-branded experience throughout the OAuth flow.',
      },
    },
  ],
};

export default function MarketingPage() {
  return (
    <main className="relative bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <HeroSection />
      <SocialProofSection />
      <PainSection />
      <SolutionSection />
      <CombinedFeaturedSection />
      <IntegrationSection />
      <HowItWorksSection />
      <SuccessStoriesSection />
      <HomepageFAQSection />
      <CTASection />
    </main>
  );
}
