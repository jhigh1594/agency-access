'use client';

import { m } from 'framer-motion';
import { Check } from 'lucide-react';

const benefits = [
  {
    title: 'Save 2-3 Days Per Client',
    description:
      'What used to take days of back-and-forth emails now happens in 5 minutes. Start campaigns faster.',
  },
  {
    title: 'Eliminate Security Risks',
    description:
      'No more password sharing via email or Slack. OAuth tokens stored securely with full audit trails.',
  },
  {
    title: 'Reduce Client Friction',
    description:
      'Clients see familiar platform login screens. No confusing setup instructions or technical jargon.',
  },
  {
    title: 'Scale Your Agency',
    description:
      'Onboard 10 clients in the time it used to take for 1. Focus on strategy, not setup.',
  },
];

export function BenefitsSection() {
  return (
    <section className="py-16 sm:py-20 md:py-24 lg:py-32 bg-paper">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <m.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12 sm:mb-16 px-4"
          >
            <h2 className="font-dela text-2xl sm:text-3xl md:text-4xl lg:text-5xl tracking-tight mb-3 sm:mb-4 text-ink">
              Why Agencies Choose Us
            </h2>
            <p className="text-base sm:text-lg text-gray-600 font-mono">
              Join agencies that have eliminated the biggest bottleneck in client onboarding.
            </p>
          </m.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
            {benefits.map((benefit, index) => (
              <m.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                whileHover={{ y: -2, boxShadow: '6px 6px 0px #000', x: -2 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex gap-3 sm:gap-4 p-4 sm:p-6 rounded-none border-2 border-black bg-card shadow-[4px_4px_0px_#000] hover:shadow-[6px_6px_0px_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-200 touch-feedback"
              >
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 sm:w-8 sm:h-8 rounded-none border-2 border-black bg-coral/10 flex items-center justify-center">
                    <Check size={20} className="text-coral sm:hidden" />
                    <Check size={16} className="text-coral hidden sm:block" />
                  </div>
                </div>
                <div>
                  <h3 className="font-black text-lg sm:text-xl mb-1.5 sm:mb-2 uppercase tracking-wider text-ink">{benefit.title}</h3>
                  <p className="text-gray-600 text-sm sm:text-base leading-relaxed font-mono">{benefit.description}</p>
                </div>
              </m.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
