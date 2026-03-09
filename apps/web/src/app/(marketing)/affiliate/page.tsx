import type { Metadata } from 'next';

import { AffiliateMetricCard, AffiliateSurfaceCard } from '@/components/affiliate';
import { AffiliateProgramForm } from '@/components/marketing/affiliate-program-form';

export const metadata: Metadata = {
  title: 'Affiliate Program | AuthHub',
  description:
    'Apply to AuthHub’s approval-based affiliate program for agency operators, consultants, and ecosystem partners.',
};

const HIGHLIGHTS = [
  {
    label: 'Default Commission',
    value: '30%',
    description: 'Recurring for the first 12 months of collected revenue.',
  },
  {
    label: 'Cookie Window',
    value: '90 days',
    description: 'Long enough for considered B2B buying cycles.',
  },
  {
    label: 'Payout Cadence',
    value: 'Monthly',
    description: 'Tracked ledger, manual review, predictable batch payouts.',
  },
];

export default function AffiliateProgramPage() {
  return (
    <div className="min-h-screen bg-paper">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-12 sm:px-6 lg:px-8">
        <section className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
          <div className="space-y-5">
            <span className="inline-flex rounded-full border border-border bg-card px-3 py-1 text-xs font-mono uppercase tracking-wide text-muted-foreground">
              Affiliate Program
            </span>
            <div className="space-y-4">
              <h1 className="max-w-3xl font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
                Refer agencies that need faster client access onboarding.
              </h1>
              <p className="max-w-2xl text-lg text-muted-foreground">
                AuthHub replaces slow, manual client access requests with one branded link. We want
                partners with trust in the agency ecosystem, not anonymous coupon traffic.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {HIGHLIGHTS.map((item) => (
                <AffiliateMetricCard
                  key={item.label}
                  label={item.label}
                  value={item.value}
                  description={item.description}
                />
              ))}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <AffiliateSurfaceCard
                title="Who we want"
                description="The first cohort is approval-based and biased toward audience fit."
              >
                <ul className="space-y-2 text-sm text-foreground">
                  <li>Agency operators with an audience</li>
                  <li>Consultants, coaches, and educators</li>
                  <li>Adjacent SaaS and service partners</li>
                  <li>Existing customers referring peers</li>
                </ul>
              </AffiliateSurfaceCard>
              <AffiliateSurfaceCard
                title="How it works"
                description="Approved partners get a link, a portal, and tracked commissions."
              >
                <ol className="space-y-2 text-sm text-foreground">
                  <li>Apply for the program</li>
                  <li>Get reviewed and approved manually</li>
                  <li>Receive your referral link and promo kit</li>
                  <li>Track signups, customers, and commission status</li>
                </ol>
              </AffiliateSurfaceCard>
            </div>
          </div>

          <AffiliateSurfaceCard
            title="Apply for the pilot cohort"
            description="Tell us who you reach and how you would promote AuthHub."
          >
            <AffiliateProgramForm />
          </AffiliateSurfaceCard>
        </section>
      </div>
    </div>
  );
}
