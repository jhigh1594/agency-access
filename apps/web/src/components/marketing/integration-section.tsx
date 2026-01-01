'use client';

import { motion } from 'framer-motion';
import IntegrationHero from '@/components/ui/integration-hero';

export function IntegrationSection() {
  return (
    <>
      <IntegrationHero />
      
      {/* Testimonial Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.5 }}
        className="max-w-xl mx-auto text-center py-8 sm:py-12 px-4"
      >
        <p className="text-base sm:text-lg text-gray-700 mb-4 sm:mb-6 leading-relaxed">
          &ldquo;AuthHub has transformed how we work saving us 15+ hours per week. The best automation tool! It connects everything seamlessly&rdquo;
        </p>
        <div className="flex items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gray-600 overflow-hidden flex-shrink-0">
            <div className="w-full h-full flex items-center justify-center text-white font-semibold text-sm">
              JD
            </div>
          </div>
          <div className="text-left">
            <p className="font-bold text-gray-900 text-sm sm:text-base">John Drove</p>
            <p className="text-xs sm:text-sm text-gray-500">CEO, GrowthHub</p>
          </div>
        </div>
      </motion.div>
    </>
  );
}
