'use client';

import { useState } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { ChevronDownIcon } from '@/components/ui/ui-icons';
import { Reveal } from '../reveal';

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: "How does the 14-day free trial work?",
    answer: "Start using Agency Access Platform immediately with full access to all features. No credit card required. After 14 days, choose the plan that fits your needs or continue with our free tier for limited access.",
  },
  {
    question: "Can I change plans later?",
    answer: "Yes! You can upgrade or downgrade your plan at any time. When upgrading, you'll be prorated for the remainder of your billing cycle. When downgrading, you'll receive credit towards future billing.",
  },
  {
    question: "What happens when I hit my client limits?",
    answer: "We'll notify you when you're approaching your limit. You can either upgrade to the next tier or purchase additional client onboarding packs. Your existing clients continue to work without interruption.",
  },
  {
    question: "Do you offer discounts for annual billing?",
    answer: "Yes! Annual billing saves you 25% compared to monthly billing. Most agencies choose annual billing for the savings and convenience.",
  },
  {
    question: "How secure is my OAuth data?",
    answer: "We use bank-level encryption (Infisical) to store all OAuth tokens. We're SOC 2 Type II compliant and GDPR ready. We never store tokens directly in our database—only secure references to encrypted vault storage.",
  },
  {
    question: "Can I use my own domain with white-label?",
    answer: "Yes! On the Agency plan and above, you can use a custom subdomain (e.g., access.youragency.com) or bring your own domain. Full white-label includes your logo, colors, and branding.",
  },
];

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-16 sm:py-20 md:py-24 bg-paper relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 1px, transparent 0, transparent 50%)',
            backgroundSize: '20px 20px',
          }}
        />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <Reveal>
          {/* Section Header */}
          <div className="text-center mb-12 sm:mb-16 max-w-3xl mx-auto">
            <div className="inline-block mb-4">
              <div className="bg-electric/10 text-electric border-2 border-electric/30 px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider inline-block">
                FAQ
              </div>
            </div>
            <h2 className="font-dela text-3xl sm:text-4xl md:text-5xl tracking-tight mb-4 text-ink">
              Common questions
            </h2>
            <p className="text-base sm:text-lg text-gray-600 font-mono">
              Everything you need to know about pricing, plans, and getting started.
            </p>
          </div>
        </Reveal>

        {/* FAQ Accordion */}
        <div className="max-w-3xl mx-auto space-y-3 sm:space-y-4">
          {faqs.map((faq, index) => (
            <Reveal key={index} delay={index * 0.05}>
              <m.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3 }}
                className="border-2 border-black bg-white shadow-brutalist-sm overflow-hidden"
              >
                {/* Question Button */}
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="font-bold text-base sm:text-lg text-ink pr-8">
                    {faq.question}
                  </span>
                  <m.div
                    animate={{ rotate: openIndex === index ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex-shrink-0"
                  >
                    <ChevronDownIcon size={20} className="text-gray-600" />
                  </m.div>
                </button>

                {/* Answer */}
                <AnimatePresence>
                  {openIndex === index && (
                    <m.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-5 pt-0 border-t-2 border-black bg-gray-50">
                        <p className="text-base text-gray-700 leading-relaxed font-mono">
                          {faq.answer}
                        </p>
                      </div>
                    </m.div>
                  )}
                </AnimatePresence>
              </m.div>
            </Reveal>
          ))}
        </div>

        {/* Still Have Questions */}
        <Reveal delay={0.3}>
          <m.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-12 text-center"
          >
            <div className="inline-block border-2 border-black bg-white p-6 shadow-brutalist-sm">
              <p className="font-mono text-sm text-gray-700 mb-4">
                Still have questions?
              </p>
              <a
                href="mailto:support@agencyaccessplatform.com"
                className="inline-block font-bold uppercase tracking-wider text-xs px-6 py-3 border-2 border-black bg-coral text-white hover:bg-ink hover:shadow-brutalist transition-all duration-200"
              >
                Contact Support
              </a>
            </div>
          </m.div>
        </Reveal>
      </div>
    </section>
  );
}
