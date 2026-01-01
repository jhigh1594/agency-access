'use client';

import { motion } from 'framer-motion';
import { ShieldCheckIcon, LockIcon, GlobeIcon } from '@/components/ui/ui-icons';

export function TrustSection() {
  return (
    <section className="py-16 sm:py-20 md:py-24 lg:py-32 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Testimonial */}
        <div className="max-w-4xl mx-auto text-center mb-16 sm:mb-24 px-2">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative p-6 sm:p-8 md:p-12 rounded-2xl sm:rounded-[3rem] bg-warm-gray/20 border border-border/50"
          >
            <blockquote className="font-display text-xl sm:text-2xl md:text-3xl lg:text-5xl italic leading-tight text-foreground relative z-10">
              &ldquo;AuthHub literally saved our onboarding process. We went from
              3-day delays to 5-minute setups. Our clients love the simplicity,
              and we love having our time back.&rdquo;
            </blockquote>
            <div className="mt-6 sm:mt-10 flex items-center justify-center gap-3 sm:gap-4 relative z-10">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-foreground/5 border-2 border-foreground/10 flex items-center justify-center font-bold text-foreground text-sm sm:text-base">SJ</div>
              <div className="text-left">
                <p className="font-bold text-base sm:text-lg">Sarah Jenkins</p>
                <p className="text-[10px] sm:text-[10px] text-muted-foreground uppercase tracking-[0.15em] sm:tracking-[0.2em] font-bold">Founder, GrowthFlow Agency</p>
              </div>
            </div>

            {/* Quote Mark - Hidden on very small screens, reduced on mobile */}
            <div className="absolute top-4 sm:top-6 md:top-8 left-4 sm:left-6 md:left-12 text-primary/10 font-display text-6xl sm:text-8xl md:text-[12rem] leading-none select-none -z-0">&ldquo;</div>
          </motion.div>
        </div>

        {/* Security Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 md:gap-8 max-w-5xl mx-auto">
          {[
            { icon: ShieldCheckIcon, title: "Enterprise Grade", desc: "Bank-level encryption for all OAuth tokens." },
            { icon: LockIcon, title: "Secure Storage", desc: "Tokens stored in Infisical vault with audit logs." },
            { icon: GlobeIcon, title: "Privacy First", desc: "GDPR and CCPA compliant architecture." },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="clean-card p-6 sm:p-8 flex flex-col items-center text-center touch-feedback"
            >
              <div className="mb-4 sm:mb-6">
                <item.icon size={24} className="text-foreground sm:hidden" />
                <item.icon size={28} className="text-foreground hidden sm:block" />
              </div>
              <h3 className="text-base sm:text-lg font-bold mb-2 sm:mb-3">{item.title}</h3>
              <p className="text-muted-foreground leading-relaxed text-xs sm:text-sm">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
