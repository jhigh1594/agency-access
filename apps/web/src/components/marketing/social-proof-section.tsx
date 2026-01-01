'use client';

import { motion } from 'framer-motion';

const agencies = [
  "GrowthFlow", "AdStream", "ScaleUp", "BrandSync", "PixelPerfect", "NexusAds"
];

export function SocialProofSection() {
  return (
    <section className="py-12 sm:py-16 border-y border-border/50 bg-warm-gray/10 relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.25em] sm:tracking-[0.3em] text-center mb-8 sm:mb-12 text-muted-foreground px-4">
          Trusted by the world&apos;s fastest growing agencies
        </p>
        {/* 2-column grid on mobile, 3 columns on tablet, auto on desktop */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-auto lg:flex lg:flex-wrap lg:justify-center lg:gap-x-24 gap-4 sm:gap-y-6 md:gap-y-8 opacity-50 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-700 ease-in-out">
          {agencies.map((name, i) => (
            <motion.div
              key={name}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center justify-center gap-2 sm:gap-3 group cursor-default touch-feedback"
            >
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-foreground/5 border border-foreground/10 flex items-center justify-center font-black text-base sm:text-xl text-foreground group-hover:border-foreground/30 group-hover:bg-foreground/10 transition-all duration-300 flex-shrink-0">
                {name[0]}
              </div>
              <span className="font-display text-base sm:text-xl md:text-2xl tracking-tighter font-bold text-foreground group-hover:text-primary transition-colors truncate">{name}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

