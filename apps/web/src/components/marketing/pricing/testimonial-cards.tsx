'use client';

import { m } from 'framer-motion';
import { Reveal } from '../reveal';
import { useMobile } from '@/hooks/use-mobile';

interface Testimonial {
  quote: string;
  author: string;
  role: string;
  company: string;
  outcome: string;
}

const testimonials: Testimonial[] = [
  // Pillar AI Agency is the only active testimonial (see success-stories-section).
  // {
  //   quote: "We went from 47 email threads to a single link. Our clients love it, and we save 20+ hours every week.",
  //   author: 'Sarah Kim',
  //   role: 'Founder',
  //   company: 'GrowthFlow Agency',
  //   outcome: '20+ hours saved per week',
  // },
  // {
  //   quote: "ROI in the first 2 weeks. We on boarded 15 new clients in the time it used to take for 3.",
  //   author: 'Mike Torres',
  //   role: 'CEO',
  //   company: 'ScaleUp Media',
  //   outcome: '5x faster onboarding',
  // },
  // {
  //   quote: "The white-label feature alone is worth 10x the price. Our clients think we built it ourselves.",
  //   author: 'Jessica Chen',
  //   role: 'Operations Lead',
  //   company: 'Nexus Digital',
  //   outcome: 'Enterprise-grade white-label',
  // },
];

export function TestimonialCards() {
  const isMobile = useMobile();
  return (
    <section className="py-16 sm:py-20 md:py-24 bg-paper relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)',
            backgroundSize: '25px 25px',
          }}
        />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <Reveal>
          {/* Section Header */}
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-block mb-4">
              <div className="bg-teal/10 text-teal border-2 border-teal/30 px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider inline-block">
                Social Proof
              </div>
            </div>
            <h2 className="font-dela text-3xl sm:text-4xl md:text-5xl tracking-tight mb-4 text-ink">
              Trusted by{' '}
              <span className="text-coral italic">performance teams</span>
            </h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto font-mono">
              See what teams are saying about their experience.
            </p>
          </div>
        </Reveal>

        {/* Testimonial Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <Reveal key={index} delay={index * 0.1}>
              <m.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -4 }}
                className="border-2 border-black bg-card p-6 sm:p-8 shadow-brutalist hover:shadow-brutalist-lg transition-all duration-300"
              >
                {/* Quote */}
                <blockquote className="mb-6">
                  <p className="text-base sm:text-lg text-gray-700 leading-relaxed">
                    "{testimonial.quote}"
                  </p>
                </blockquote>

                {/* Outcome Badge */}
                <div className="inline-block mb-4">
                  <div className="bg-coral/10 text-coral border-2 border-coral/30 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider">
                    {testimonial.outcome}
                  </div>
                </div>

                {/* Author */}
                <div className="border-t-2 border-black pt-4">
                  <div className="font-bold text-ink mb-0.5">{testimonial.author}</div>
                  <div className="font-mono text-xs text-gray-600">
                    {testimonial.role}, {testimonial.company}
                  </div>
                </div>
              </m.div>
            </Reveal>
          ))}
        </div>

        {/* Marquee - Additional Quotes (static grid on mobile, animated on desktop) */}
        <Reveal delay={0.3}>
          <m.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mt-12 sm:mt-16"
          >
            <div className="border-2 border-black bg-card p-6 sm:p-8 shadow-brutalist-sm max-w-4xl mx-auto">
              {isMobile ? (
                // Static grid for mobile
                <div className="grid grid-cols-1 gap-4">
                  {[
                    '"Saved us $50K in the first quarter"',
                    '"Best tool investment we made this year"',
                    '"Onboarding time cut by 80%"',
                    '"Clients actually compliment the process"',
                    '"Paid for itself in 2 weeks"',
                  ].map((quote, i) => (
                    <div
                      key={i}
                      className="font-mono text-sm text-gray-600 flex items-center gap-2 border-b border-gray-200 last:border-0 pb-3 last:pb-0"
                    >
                      <span className="text-coral flex-shrink-0">◆</span>
                      <span>{quote}</span>
                    </div>
                  ))}
                </div>
              ) : (
                // Marquee for desktop
                <div className="flex items-center gap-4 sm:gap-6 overflow-hidden">
                  <m.div
                    animate={{ x: [0, -20, 0] }}
                    transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                    className="flex gap-6 sm:gap-8 whitespace-nowrap"
                  >
                    {[
                      '"Saved us $50K in the first quarter"',
                      '"Best tool investment we made this year"',
                      '"Onboarding time cut by 80%"',
                      '"Clients actually compliment the process"',
                      '"Paid for itself in 2 weeks"',
                    ].map((quote, i) => (
                      <div
                        key={i}
                        className="font-mono text-xs sm:text-sm text-gray-600 flex items-center gap-2"
                      >
                        <span className="text-coral">◆</span>
                        <span>{quote}</span>
                      </div>
                    ))}
                  </m.div>
                </div>
              )}
            </div>
          </m.div>
        </Reveal>
      </div>
    </section>
  );
}
