'use client';

import { m } from 'framer-motion';
import { ShieldCheckIcon, LockIcon, GlobeIcon } from '@/components/ui/ui-icons';

export function TrustSection() {
  return (
    <section className="py-16 sm:py-20 md:py-24 lg:py-32 bg-card">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Testimonial - Brutalist card (commented out; only Pillar AI Agency testimonial is active) */}
        {/* <div className="max-w-4xl mx-auto text-center mb-16 sm:mb-24 px-2">
          <m.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative p-6 sm:p-8 md:p-12 rounded-none border-2 border-black shadow-brutalist-xl bg-card"
          >
            <blockquote className="font-display text-xl sm:text-2xl md:text-3xl lg:text-5xl italic leading-tight text-ink relative z-10">
              &ldquo;AuthHub literally saved our onboarding process. We went from
              3-day delays to 5-minute setups. Our clients love the simplicity,
              and we love having our time back.&rdquo;
            </blockquote>
            <div className="mt-6 sm:mt-10 flex items-center justify-center gap-3 sm:gap-4 relative z-10">
              <div className="w-12 h-12 sm:w-14 sm:h-14 border-2 border-black bg-coral flex items-center justify-center font-black text-white text-sm sm:text-base rounded-none">SJ</div>
              <div className="text-left">
                <p className="font-black text-base sm:text-lg">Sarah Jenkins</p>
                <p className="text-[10px] sm:text-[10px] text-gray-600 uppercase tracking-[0.15em] sm:tracking-[0.2em] font-bold font-mono">Founder, GrowthFlow Agency</p>
              </div>
            </div>

            <div className="absolute top-4 sm:top-6 md:top-8 left-4 sm:left-6 md:left-12 text-coral/10 font-dela text-6xl sm:text-8xl md:text-[12rem] leading-none select-none -z-0">&ldquo;</div>
          </m.div>
        </div> */}

        {/* Security Grid - Brutalist cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 md:gap-8 max-w-5xl mx-auto">
          {[
            { icon: ShieldCheckIcon, title: "Enterprise Grade", desc: "Bank-level encryption for all OAuth tokens." },
            { icon: LockIcon, title: "Secure Storage", desc: "Tokens stored in Infisical vault with audit logs." },
            { icon: GlobeIcon, title: "Privacy First", desc: "GDPR and CCPA compliant architecture." },
          ].map((item, i) => (
            <m.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ y: -2, boxShadow: '6px 6px 0px #000', x: -2 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-6 sm:p-8 flex flex-col items-center text-center border-2 border-black bg-card shadow-[4px_4px_0px_#000] rounded-none hover:shadow-[6px_6px_0px_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-200 touch-feedback"
            >
              <div className="mb-4 sm:mb-6">
                <item.icon size={24} className="text-ink sm:hidden" />
                <item.icon size={28} className="text-ink hidden sm:block" />
              </div>
              <h3 className="text-base sm:text-lg font-black mb-2 sm:mb-3 uppercase tracking-wider">{item.title}</h3>
              <p className="text-gray-600 leading-relaxed text-xs sm:text-sm font-mono">{item.desc}</p>
            </m.div>
          ))}
        </div>
      </div>
    </section>
  );
}
