'use client';

import { motion } from 'framer-motion';
import { ShieldCheckIcon, LockIcon, GlobeIcon } from '@/components/ui/ui-icons';

export function TrustSection() {
  return (
    <section className="py-24 sm:py-32 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Testimonial */}
        <div className="max-w-4xl mx-auto text-center mb-24">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative p-12 rounded-[3rem] bg-warm-gray/20 border border-border/50"
          >
            <blockquote className="font-display text-3xl sm:text-4xl lg:text-5xl italic leading-tight text-foreground relative z-10">
              &ldquo;AuthHub literally saved our onboarding process. We went from 
              3-day delays to 5-minute setups. Our clients love the simplicity, 
              and we love having our time back.&rdquo;
            </blockquote>
            <div className="mt-10 flex items-center justify-center gap-4 relative z-10">
              <div className="w-14 h-14 rounded-full bg-foreground/5 border-2 border-foreground/10 flex items-center justify-center font-bold text-foreground">SJ</div>
              <div className="text-left">
                <p className="font-bold text-lg">Sarah Jenkins</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-bold">Founder, GrowthFlow Agency</p>
              </div>
            </div>
            
            {/* Quote Mark */}
            <div className="absolute top-8 left-12 text-primary/10 font-display text-[12rem] leading-none select-none">&ldquo;</div>
          </motion.div>
        </div>

        {/* Security Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-5xl mx-auto">
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
              className="clean-card p-8 flex flex-col items-center text-center"
            >
              <div className="mb-6">
                <item.icon size={28} className="text-foreground" />
              </div>
              <h3 className="text-lg font-bold mb-3">{item.title}</h3>
              <p className="text-muted-foreground leading-relaxed text-sm">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
