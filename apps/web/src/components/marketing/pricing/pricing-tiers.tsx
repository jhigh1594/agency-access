'use client';

import { useState } from 'react';
import { m } from 'framer-motion';
import { PricingToggle } from './pricing-toggle';
import { PricingTierCard } from './pricing-tier-card';
import { Reveal } from '../reveal';

// Feature interface with optional value context
interface Feature {
  name: string;
  included: boolean;
  value?: string; // Why this matters
}

const tierFeatures = {
  free: [
    { name: '1 active client', included: true, value: 'Test the full flow' },
    { name: 'Core platforms (Meta, Google, LinkedIn)', included: true, value: 'The essentials' },
    { name: 'Basic branding (logo upload)', included: true },
    { name: 'Email support', included: true },
    { name: 'Team access', included: false },
    { name: 'White-label branding', included: false },
    { name: 'Custom domain', included: false },
    { name: 'Webhooks & API', included: false },
    { name: 'Priority support', included: false },
  ],
  growth: [
    { name: '5 clients/month', included: true, value: '60 onboards/year' },
    { name: 'All platform integrations', included: true, value: 'Meta, Google, LinkedIn, TikTok, more' },
    { name: 'White-label branding', included: true, value: 'Your brand, not ours' },
    { name: 'Team access (3 seats)', included: true, value: 'Share the work' },
    { name: 'Email support', included: true },
    { name: 'Custom domain', included: false },
    { name: 'Webhooks & API', included: false },
    { name: 'Priority support', included: false },
  ],
  scale: [
    { name: '15 clients/month', included: true, value: '180 onboards/year' },
    { name: 'All platform integrations', included: true },
    { name: 'White-label branding', included: true },
    { name: 'Custom domain', included: true, value: 'Your URL, your brand' },
    { name: 'Team access (10 seats)', included: true, value: 'Full team collaboration' },
    { name: 'Webhooks & API', included: true, value: 'Connect your stack' },
    { name: 'Priority support', included: true, value: 'Faster response time' },
    { name: 'Multi-brand accounts', included: true, value: 'Manage multiple brands' },
    { name: 'Custom integrations', included: true, value: 'We build what you need' },
  ],
};

export function PricingTiers() {
  const [isYearly, setIsYearly] = useState(true);

  return (
    <section id="pricing" className="py-16 sm:py-20 md:py-24 bg-paper relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)',
            backgroundSize: '30px 30px',
          }}
        />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <Reveal>
          {/* Section Header */}
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-block mb-4">
              <div className="bg-coral/10 text-coral border-2 border-coral/30 px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider inline-block">
                Simple Pricing
              </div>
            </div>
            <h2 className="font-dela text-3xl sm:text-4xl md:text-5xl lg:text-6xl tracking-tight mb-4 sm:mb-6 text-ink">
              Choose the plan that{' '}
              <span className="text-coral italic">fits your agency</span>
            </h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto font-mono">
              Start free, upgrade when you're ready. Growth plan includes a 14-day free trial.
            </p>
          </div>

          {/* Toggle */}
          <PricingToggle isYearly={isYearly} onToggle={setIsYearly} />
        </Reveal>

        {/* Mobile-Friendly Tier Summary */}
        <div className="md:hidden mb-8">
          <div className="border-2 border-black bg-card p-4 shadow-brutalist-sm">
            <div className="space-y-3 font-mono text-sm">
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="font-bold text-ink">Free</span>
                <span className="text-gray-600">1 client</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200 bg-coral/5 -mx-2 px-2">
                <span className="font-bold text-coral">Growth → Most Popular</span>
                <span className="text-gray-600">{isYearly ? '$30/mo' : '$40/mo'}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="font-bold text-ink">Scale</span>
                <span className="text-gray-600">{isYearly ? '$70/mo' : '$93/mo'}</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-4 text-center font-mono">
              Scroll down for full comparison →
            </p>
          </div>
        </div>

        {/* Bento Grid Layout - Now visible on all screens */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-7xl mx-auto">
          {/* Free Tier */}
          <div className="md:col-span-1">
            <PricingTierCard
              name="Free"
              description="Solo freelancers testing OAuth automation"
              persona="For individuals"
              yearlyPrice={0}
              monthlyPrice={0}
              isYearly={isYearly}
              isFree={true}
              hasTrial={false}
              features={tierFeatures.free}
              buttonText="Get Started Free"
              buttonVariant="brutalist-ghost"
              billingInterval={isYearly ? 'yearly' : 'monthly'}
              onUpgradeClick={() => {
                // Scroll to Growth tier and trigger signup
                const growthCard = document.querySelector('[data-tier="GROWTH"]');
                if (growthCard) {
                  growthCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
              }}
            />
          </div>

          {/* Growth Tier (Most Popular) - Has Free Trial */}
          <div className="md:col-span-1" data-tier="GROWTH">
            <PricingTierCard
              tier="GROWTH"
              name="Growth"
              description="Growing agencies with 3-5 new clients/month"
              persona="For small teams"
              yearlyPrice={480}
              monthlyPrice={40}
              isYearly={isYearly}
              isPopular={true}
              hasTrial={true}
              features={tierFeatures.growth}
              buttonText="Start Free Trial"
              buttonVariant="brutalist-rounded"
              billingInterval={isYearly ? 'yearly' : 'monthly'}
            />
          </div>

          {/* Scale Tier - No Free Trial */}
          <div className="md:col-span-1">
            <PricingTierCard
              tier="SCALE"
              name="Scale"
              description="Established agencies onboarding 10+ clients/month"
              persona="For growing agencies"
              yearlyPrice={1120}
              monthlyPrice={93.33}
              isYearly={isYearly}
              hasTrial={false}
              features={tierFeatures.scale}
              buttonText="Get Started"
              buttonVariant="brutalist-rounded"
              billingInterval={isYearly ? 'yearly' : 'monthly'}
            />
          </div>
        </div>

        {/* Payback Callout */}
        <Reveal delay={0.2}>
          <m.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mt-12 sm:mt-16 text-center"
          >
            <div className="inline-flex items-center gap-3 bg-teal/10 border-2 border-teal/30 px-6 py-4 max-w-xl mx-auto">
              <span className="text-2xl">💡</span>
              <div className="text-left">
                <p className="font-bold text-ink text-sm">Pays for itself in 1 client onboarding</p>
                <p className="text-xs text-gray-600 font-mono">Most agencies save 3+ hours per client. At $85/hr, that's $255 saved per onboard.</p>
              </div>
            </div>
          </m.div>
        </Reveal>
      </div>
    </section>
  );
}
