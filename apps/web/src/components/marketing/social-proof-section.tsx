'use client';

import { motion } from 'framer-motion';

const agencies = [
  "GrowthFlow", "AdStream", "ScaleUp", "BrandSync", "PixelPerfect", "NexusAds"
];

// Duplicate for seamless marquee loop
const marqueeAgencies = [...agencies, ...agencies, ...agencies];

export function SocialProofSection() {
  return (
    <section className="py-12 sm:py-16 border-y-2 border-black bg-paper relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 mb-8 sm:mb-12">
        <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.25em] sm:tracking-[0.3em] text-center text-ink font-mono">
          Trusted by the world&apos;s fastest growing agencies
        </p>
      </div>

      {/* Marquee container */}
      <div className="relative overflow-hidden">
        {/* Marquee track - infinite scroll animation */}
        <motion.div
          initial={{ x: 0 }}
          animate={{ x: '-50%' }}
          transition={{
            duration: 30,
            ease: 'linear',
            repeat: Infinity,
          }}
          className="flex gap-6 sm:gap-12 whitespace-nowrap"
        >
          {marqueeAgencies.map((name, i) => (
            <div
              key={`${name}-${i}`}
              className="flex items-center justify-center gap-3 px-6 py-4 border-2 border-black bg-white shadow-[4px_4px_0px_#000] rounded-none hover:shadow-[6px_6px_0px_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-200 cursor-default touch-feedback flex-shrink-0"
            >
              {/* Monogram icon */}
              <div className="w-10 h-10 border-2 border-black bg-coral flex items-center justify-center font-black text-xl text-white rounded-none flex-shrink-0">
                {name[0]}
              </div>
              {/* Agency name */}
              <span className="font-dela text-xl sm:text-2xl tracking-tight font-bold text-ink truncate">
                {name}
              </span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
