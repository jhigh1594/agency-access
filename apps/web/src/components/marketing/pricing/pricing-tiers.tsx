'use client';

import { useState } from 'react';
import { m } from 'framer-motion';
import { PricingToggle } from './pricing-toggle';
import { PricingTierCard } from './pricing-tier-card';
import { Reveal } from '../reveal';

const tierFeatures = {
  starter: [
    { name: '36 client onboards/year', included: true },
    { name: '120 platform audits', included: true },
    { name: 'All platform integrations', included: true },
    { name: 'Email support', included: true },
    { name: 'White-label branding', included: false },
    { name: 'Custom domain/subdomain', included: false },
    { name: 'Team access', included: false },
    { name: 'Webhooks & API', included: false },
    { name: 'Priority support', included: false },
  ],
  agency: [
    { name: '120 client onboards/year', included: true },
    { name: '600 platform audits', included: true },
    { name: 'White-label branding', included: true },
    { name: 'Custom domain/subdomain', included: true },
    { name: 'Team access (5 seats)', included: true },
    { name: 'Webhooks & API', included: true },
    { name: 'Priority support', included: true },
    { name: 'Multi-brand accounts', included: false },
    { name: 'Custom integrations', included: false },
    { name: 'SLA guarantee', included: false },
  ],
  pro: [
    { name: '600 client onboards/year', included: true },
    { name: '3,000 platform audits', included: true },
    { name: 'White-label branding', included: true },
    { name: 'Custom domain/subdomain', included: true },
    { name: 'Unlimited team seats', included: true },
    { name: 'Webhooks & API', included: true },
    { name: 'Multi-brand accounts (3)', included: true },
    { name: 'API access', included: true },
    { name: 'Custom integrations', included: true },
    { name: 'Priority support (dedicated)', included: true },
    { name: 'SLA guarantee', included: true },
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
              Scale your client onboarding without the complexity. All plans include a 14-day free trial.
            </p>
          </div>

          {/* Toggle */}
          <PricingToggle isYearly={isYearly} onToggle={setIsYearly} />
        </Reveal>

        {/* Mobile Message */}
        <div className="md:hidden text-center py-12">
          <div className="border-2 border-black bg-white p-6 shadow-brutalist-sm max-w-md mx-auto">
            <h3 className="font-dela text-2xl text-ink mb-4">
              View pricing on desktop
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Our pricing tiers are best viewed on a larger screen. Switch to desktop or tablet to see all plan details.
            </p>
            <a
              href="https://cal.com/agency-access-platform/demo"
              target="_blank"
              rel="noopener noreferrer"
            >
              <button className="font-bold uppercase tracking-wider text-xs px-6 py-3 border-2 border-black bg-coral text-white hover:shadow-brutalist transition-all duration-200 w-full">
                Talk to Sales
              </button>
            </a>
          </div>
        </div>

        {/* Bento Grid Layout - Hidden on mobile */}
        <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 max-w-7xl mx-auto">
          {/* Starter Tier */}
          <div className="md:col-span-1">
            <PricingTierCard
              name="Starter"
              description="For growing agencies getting started"
              yearlyPrice={480}
              monthlyPrice={40}
              isYearly={isYearly}
              features={tierFeatures.starter}
              buttonText="Start Free Trial"
              buttonVariant="brutalist-ghost"
            />
          </div>

          {/* Agency Tier (Most Popular) */}
          <div className="md:col-span-1 lg:col-span-1">
            <m.div
              initial={{ scale: 1 }}
              whileInView={{ scale: 1.02 }}
              viewport={{ once: true }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            >
              <PricingTierCard
                name="Agency"
                description="For established agencies scaling fast"
                yearlyPrice={1120}
                monthlyPrice={93.33}
                isYearly={isYearly}
                isPopular={true}
                features={tierFeatures.agency}
                buttonText="Start Free Trial"
                buttonVariant="brutalist-rounded"
              />
            </m.div>
          </div>

          {/* Pro Tier */}
          <div className="md:col-span-2 lg:col-span-1">
            <PricingTierCard
              name="Pro"
              description="For large agencies with multi-brand needs"
              yearlyPrice={2240}
              monthlyPrice={186.67}
              isYearly={isYearly}
              isPro={true}
              features={tierFeatures.pro}
              buttonText="Start Free Trial"
              buttonVariant="brutalist-rounded"
            />
          </div>
        </div>

        {/* Enterprise CTA */}
        <Reveal delay={0.2}>
          <m.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mt-12 sm:mt-16 text-center"
          >
            <div className="inline-block border-2 border-black bg-white p-6 sm:p-8 shadow-brutalist-sm max-w-2xl mx-auto">
              <p className="font-mono text-sm text-gray-600 mb-3">
                Need unlimited everything or a custom solution?
              </p>
              <h3 className="font-dela text-xl sm:text-2xl text-ink mb-4">
                Enterprise plans available
              </h3>
              <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">
                Get dedicated support, custom integrations, and unlimited client onboarding.
              </p>
              <a
                href="https://cal.com/agency-access-platform/demo"
                target="_blank"
                rel="noopener noreferrer"
              >
                <button className="font-bold uppercase tracking-wider text-xs px-6 py-3 border-2 border-black bg-transparent hover:bg-ink hover:text-white hover:shadow-brutalist transition-all duration-200">
                  Contact Sales →
                </button>
              </a>
            </div>
          </m.div>
        </Reveal>
      </div>
    </section>
  );
}
