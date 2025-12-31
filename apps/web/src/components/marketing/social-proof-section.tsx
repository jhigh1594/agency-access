'use client';

import { motion } from 'framer-motion';

const agencies = [
  "GrowthFlow", "AdStream", "ScaleUp", "BrandSync", "PixelPerfect", "NexusAds"
];

export function SocialProofSection() {
  return (
    <section className="py-16 border-y border-border/50 bg-warm-gray/10 relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <p className="text-[11px] font-black uppercase tracking-[0.3em] text-center mb-12 text-muted-foreground">
          Trusted by the world&apos;s fastest growing agencies
        </p>
        <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-10 md:gap-x-24 opacity-50 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-700 ease-in-out">
          {agencies.map((name, i) => (
            <motion.div
              key={name}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center gap-3 group cursor-default"
            >
              <div className="w-10 h-10 rounded-xl bg-foreground/5 border border-foreground/10 flex items-center justify-center font-black text-xl text-foreground group-hover:border-foreground/30 group-hover:bg-foreground/10 transition-all duration-300">
                {name[0]}
              </div>
              <span className="font-display text-2xl tracking-tighter font-bold text-foreground group-hover:text-primary transition-colors">{name}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

