import { redirect } from 'next/navigation';

interface AgencyOnboardingRedirectProps {
  searchParams?: {
    tier?: string;
  };
}

export default function AgencyOnboardingRedirect({
  searchParams,
}: AgencyOnboardingRedirectProps) {
  const tier = searchParams?.tier;

  if (tier) {
    redirect(`/onboarding/unified?tier=${encodeURIComponent(tier)}`);
  }

  redirect('/onboarding/unified');
}
