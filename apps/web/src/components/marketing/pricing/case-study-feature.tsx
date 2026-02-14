'use client';

import { m } from 'framer-motion';
import { ArrowRightIcon } from '@/components/ui/ui-icons';
import { Reveal } from '../reveal';

export function CaseStudyFeature() {
  return (
    <section className="py-16 sm:py-20 md:py-24 bg-card relative overflow-hidden">
      {/* Background Accent */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-coral/5 -z-0 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal/5 -z-0 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <Reveal>
          <m.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-5xl mx-auto"
          >
            {/* Case Study Card */}
            <div className="border-2 border-coral bg-card p-8 sm:p-12 shadow-brutalist-lg relative">
              {/* Badge */}
              <div className="absolute -top-3 -left-3 bg-coral text-white border-2 border-black px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider shadow-brutalist-sm">
                Case Study
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                {/* Content */}
                <div>
                  <p className="font-mono text-xs font-bold uppercase tracking-wider text-coral mb-3">
                    Featured Story
                  </p>
                  <h2 className="font-dela text-2xl sm:text-3xl lg:text-4xl text-ink mb-4 leading-tight">
                    How GrowthFlow scaled from{' '}
                    <span className="text-coral italic">15 → 50 clients</span>
                  </h2>
                  <p className="text-base text-gray-700 mb-6 leading-relaxed">
                    GrowthFlow Agency was drowning in email threads and manual OAuth setup. With
                    AuthHub, they automated their entire client onboarding flow and
                    reclaimed 480+ hours per year.
                  </p>

                  {/* Before/After */}
                  <div className="space-y-4 mb-8">
                    <div className="flex items-start gap-4">
                      <div className="bg-gray-100 text-gray-600 px-3 py-1 font-mono text-xs font-bold uppercase border-2 border-black flex-shrink-0">
                        Before
                      </div>
                      <div className="text-sm text-gray-700">
                        <span className="font-bold">47 email threads</span> per client •
                        3-day average setup time • Constant back-and-forth
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="bg-acid/20 text-ink px-3 py-1 font-mono text-xs font-bold uppercase border-2 border-black flex-shrink-0">
                        After
                      </div>
                      <div className="text-sm text-gray-700">
                        <span className="font-bold">1 single link</span> to send • 5-minute
                        authorization • Zero manual work
                      </div>
                    </div>
                  </div>

                  {/* CTA */}
                  <a
                    href="#case-study"
                    className="inline-flex items-center gap-2 font-bold uppercase tracking-wider text-xs px-6 py-3 border-2 border-black bg-transparent hover:bg-ink hover:text-white hover:shadow-brutalist transition-all duration-200 group"
                  >
                    Read Full Story
                    <ArrowRightIcon
                      size={16}
                      className="group-hover:translate-x-1 transition-transform"
                    />
                  </a>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
                  <div className="border-2 border-black bg-paper p-4 sm:p-6 shadow-brutalist-sm">
                    <div className="font-dela text-3xl sm:text-4xl lg:text-5xl text-coral mb-1">
                      3.3x
                    </div>
                    <div className="font-mono text-[10px] sm:text-xs text-gray-600 uppercase tracking-wider">
                      More Clients
                    </div>
                  </div>
                  <div className="border-2 border-black bg-paper p-4 sm:p-6 shadow-brutalist-sm">
                    <div className="font-dela text-3xl sm:text-4xl lg:text-5xl text-teal mb-1">
                      480h
                    </div>
                    <div className="font-mono text-[10px] sm:text-xs text-gray-600 uppercase tracking-wider">
                      Saved Per Year
                    </div>
                  </div>
                  <div className="border-2 border-black bg-paper p-4 sm:p-6 shadow-brutalist-sm col-span-2">
                    <div className="font-dela text-3xl sm:text-4xl lg:text-5xl text-ink mb-1">
                      $72K
                    </div>
                    <div className="font-mono text-[10px] sm:text-xs text-gray-600 uppercase tracking-wider">
                      Annual Revenue Increase
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </m.div>
        </Reveal>
      </div>
    </section>
  );
}
