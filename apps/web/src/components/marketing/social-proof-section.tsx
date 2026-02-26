'use client';

import { m } from 'framer-motion';
import { useMobile } from '@/hooks/use-mobile';

const valueHighlights = [
  {
    badge: '01',
    title: 'One Link Onboarding',
    detail: 'Send one secure link for Meta, Google, LinkedIn, and more.',
  },
  {
    badge: '02',
    title: 'Built-In Token Refresh',
    detail: 'Keep access alive automatically with no manual reconnect work.',
  },
  {
    badge: '03',
    title: 'White-Label Client Experience',
    detail: 'Add your logo, colors, and domain for a consistent handoff.',
  },
  {
    badge: '04',
    title: 'Audit Logs Included',
    detail: 'Track who accessed what and when for internal accountability.',
  },
  {
    badge: '05',
    title: 'Fast Client Setup',
    detail: 'Turn day-long onboarding into a flow your clients can finish quickly.',
  },
  {
    badge: '06',
    title: 'Platform Coverage',
    detail: 'Manage paid media access across major ad and analytics platforms.',
  },
];

// Duplicate for seamless marquee loop (desktop only)
const marqueeHighlights = [...valueHighlights, ...valueHighlights, ...valueHighlights];

export function SocialProofSection() {
  const isMobile = useMobile();
  return (
    <section className="py-12 sm:py-16 border-y-2 border-black bg-paper relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 mb-8 sm:mb-12">
        <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.25em] sm:tracking-[0.3em] text-center text-ink font-mono">
          Built for faster onboarding and cleaner client handoffs
        </p>
      </div>

      {/* Marquee container - static grid on mobile, animated marquee on desktop */}
      <div className="relative overflow-hidden">
        {isMobile ? (
          // Static grid for mobile
          <div className="grid grid-cols-1 gap-4 px-4 sm:px-6 lg:px-8">
            {valueHighlights.map((item, i) => (
              <div
                key={`${item.title}-${i}`}
                className="flex items-start gap-3 px-4 py-4 border-2 border-black bg-card shadow-[4px_4px_0px_#000] rounded-none hover:shadow-[6px_6px_0px_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-200 cursor-default touch-feedback"
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
          // Marquee track - infinite scroll animation for desktop
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
            {marqueeHighlights.map((item, i) => (
              <div
                key={`${item.title}-${i}`}
                className="flex items-center gap-4 px-6 py-4 border-2 border-black bg-card shadow-[4px_4px_0px_#000] rounded-none hover:shadow-[6px_6px_0px_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-200 cursor-default touch-feedback flex-shrink-0 min-w-[420px]"
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
