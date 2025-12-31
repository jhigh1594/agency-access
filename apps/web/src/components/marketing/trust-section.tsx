'use client';

import { motion } from 'framer-motion';
import { ShieldCheck, Lock, Globe } from 'lucide-react';

export function TrustSection() {
  return (
    <section className="py-24 sm:py-32 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Testimonial */}
        <div className="max-w-4xl mx-auto text-center mb-24">
          <motion.blockquote
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-display text-3xl sm:text-4xl lg:text-5xl italic leading-tight text-foreground"
          >
            &ldquo;AuthHub literally saved our onboarding process. We went from 
            3-day delays to 5-minute setups. Our clients love the simplicity, 
            and we love having our time back.&rdquo;
          </motion.blockquote>
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="mt-10 flex items-center justify-center gap-4"
          >
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 border-2 border-white shadow-md" />
            <div className="text-left">
              <p className="font-bold text-lg">Sarah Jenkins</p>
              <p className="text-sm text-muted-foreground uppercase tracking-widest font-bold">Founder, GrowthFlow Agency</p>
            </div>
          </motion.div>
        </div>

        {/* Security Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {[
            { icon: ShieldCheck, title: "Enterprise Grade", desc: "Bank-level encryption for all OAuth tokens." },
            { icon: Lock, title: "Secure Storage", desc: "Tokens stored in Infisical vault with audit logs." },
            { icon: Globe, title: "Privacy First", desc: "GDPR and CCPA compliant architecture." },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-8 rounded-[2rem] border border-border bg-card/50 flex flex-col items-center text-center hover:bg-card transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
            >
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6">
                <item.icon className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold mb-3">{item.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

