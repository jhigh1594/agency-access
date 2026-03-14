'use client';

import { m } from 'framer-motion';
import { useMobile } from '@/hooks/use-mobile';

const valueHighlights = [
  {
    badge: '01',
    title: 'One branded request',
    detail: 'Send one client-facing link instead of a long setup email for each platform.',
  },
  {
    badge: '02',
    title: 'Guided client authorization',
    detail: 'Clients move through one onboarding flow instead of jumping between instruction docs.',
  },
  {
    badge: '03',
    title: 'Core platform coverage',
    detail: 'Collect the access you need for Meta, Google Ads, GA4, LinkedIn, and related tools.',
  },
  {
    badge: '04',
    title: 'Built-in token refresh',
    detail: 'Keep OAuth access maintained after kickoff without manual reconnect cleanup.',
  },
  {
    badge: '05',
    title: 'White-label client experience',
    detail: 'Make the handoff feel organized with your logo, colors, and branded request flow.',
  },
  {
    badge: '06',
    title: 'Access tracking in one place',
    detail: 'See request progress, token status, and audit details without digging through inbox threads.',
  },
];

const marqueeHighlights = [...valueHighlights, ...valueHighlights, ...valueHighlights];

export function HeroCopyRewriteSocialProofSection() {
  const isMobile = useMobile();

  return (
    <section className="py-12 sm:py-16 border-y-2 border-black bg-paper relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 mb-8 sm:mb-12">
        <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.25em] sm:tracking-[0.3em] text-center text-ink font-mono">
          What agencies use AuthHub for during onboarding
        </p>
      </div>

      <div className="relative overflow-hidden">
        {isMobile ? (
          <div className="grid grid-cols-1 gap-4 px-4 sm:px-6 lg:px-8">
            {valueHighlights.map((item, index) => (
              <div
                key={`${item.title}-${index}`}
                className="flex items-start gap-3 px-4 py-4 border-2 border-black bg-card shadow-[4px_4px_0px_#000] rounded-none transition-all duration-200 cursor-default touch-feedback"
              >
                <div className="w-8 h-8 border-2 border-black bg-coral flex items-center justify-center font-black text-xs text-white rounded-none flex-shrink-0">
                  {item.badge}
                </div>
                <div className="min-w-0">
                  <p className="font-dela text-base tracking-tight font-bold text-ink">
                    {item.title}
                  </p>
                  <p className="font-mono text-xs text-gray-600 mt-1 leading-relaxed">
                    {item.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <m.div
            initial={{ x: 0 }}
            animate={{ x: '-50%' }}
            transition={{
              duration: 30,
              ease: 'linear',
              repeat: Infinity,
            }}
            className="flex gap-6 sm:gap-12 whitespace-nowrap animate-marquee"
          >
            {marqueeHighlights.map((item, index) => (
              <div
                key={`${item.title}-${index}`}
                className="flex items-center gap-4 px-6 py-4 border-2 border-black bg-card shadow-[4px_4px_0px_#000] rounded-none transition-all duration-200 cursor-default touch-feedback flex-shrink-0 min-w-[440px]"
              >
                <div className="w-10 h-10 border-2 border-black bg-coral flex items-center justify-center font-black text-sm text-white rounded-none flex-shrink-0">
                  {item.badge}
                </div>
                <div className="min-w-0">
                  <p className="font-dela text-lg tracking-tight font-bold text-ink truncate">
                    {item.title}
                  </p>
                  <p className="font-mono text-xs sm:text-sm text-gray-600 leading-relaxed">
                    {item.detail}
                  </p>
                </div>
              </div>
            ))}
          </m.div>
        )}
      </div>
    </section>
  );
}
