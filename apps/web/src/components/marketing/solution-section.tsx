'use client';

import { m } from 'framer-motion';
import { ShieldCheckIcon, ZapIcon, UsersIcon, BarChart3Icon } from '@/components/ui/ui-icons';

const stats = [
  { value: "50+", label: "Agencies", icon: UsersIcon, delay: 0.1 },
  { value: "5 min", label: "Avg Setup", icon: ZapIcon, delay: 0.2 },
  { value: "99.9%", label: "Success Rate", icon: ShieldCheckIcon, delay: 0.3 },
  { value: "8+", label: "Platforms", icon: BarChart3Icon, delay: 0.4 },
];

export function SolutionSection() {
  return (
    <section className="py-16 pb-32 sm:py-20 sm:pb-28 md:py-24 md:pb-32 lg:py-28 xl:py-32 overflow-hidden bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-12 sm:gap-12 md:gap-16 lg:gap-24">
          {/* Left: Isometric Layers - Brutalist styling - Mobile optimized */}
          <div className="flex flex-1 relative w-full order-2 lg:order-1 mt-8 sm:mt-0 min-h-[280px] xs:min-h-[320px] sm:min-h-[400px] md:min-h-[500px]">
            <div className="absolute inset-0 flex items-center justify-center">
              {/* Layer 3 (Bottom) - Brutalist */}
              <m.div
                initial={{ opacity: 0, y: 40, rotateX: 45, rotateZ: -10 }}
                whileInView={{ opacity: 0.3, y: 60, rotateX: 45, rotateZ: -10 }}
                viewport={{ once: true }}
                className="absolute w-24 h-32 xs:w-32 xs:h-40 sm:w-48 sm:h-60 md:w-64 md:h-80 bg-gray-100 border-2 border-black rounded-none shadow-[4px_4px_0px_#000] translate-x-2 xs:translate-x-4 sm:translate-x-6 md:translate-x-10"
              />

              {/* Layer 2 (Middle) - Brutalist */}
              <m.div
                initial={{ opacity: 0, y: 20, rotateX: 45, rotateZ: -10 }}
                whileInView={{ opacity: 0.6, y: 30, rotateX: 45, rotateZ: -10 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="absolute w-24 h-32 xs:w-32 xs:h-40 sm:w-48 sm:h-60 md:w-64 md:h-80 bg-white border-2 border-black rounded-none shadow-[6px_6px_0px_#000] translate-x-1 xs:translate-x-2 sm:translate-x-3 md:translate-x-5"
              />

              {/* Layer 1 (Top) - Brutalist with teal accent */}
              <m.div
                initial={{ opacity: 0, y: 0, rotateX: 45, rotateZ: -10 }}
                whileInView={{ opacity: 1, y: 0, rotateX: 45, rotateZ: -10 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="absolute w-24 h-32 xs:w-32 xs:h-40 sm:w-48 sm:h-60 md:w-64 md:h-80 bg-white border-2 border-black rounded-none shadow-brutalist-xl z-10 flex flex-col p-2 xs:p-3 sm:p-4 md:p-6 gap-1 xs:gap-1.5 sm:gap-2 md:gap-4"
              >
                <div className="h-2 xs:h-2.5 sm:h-3 md:h-4 w-3/4 bg-gray-100 rounded-none" />
                <div className="h-10 xs:h-14 sm:h-20 md:h-32 w-full bg-teal/10 border border-black rounded-none" />
                <div className="space-y-0.5 xs:space-y-1 sm:space-y-1.5 md:space-y-2">
                  <div className="h-1 xs:h-1.5 sm:h-2 md:h-3 w-full bg-gray-100 rounded-none" />
                  <div className="h-1 xs:h-1.5 sm:h-2 md:h-3 w-5/6 bg-gray-100 rounded-none" />
                </div>
                <div className="mt-auto h-4 xs:h-6 sm:h-8 md:h-10 w-full bg-coral/10 border-2 border-black rounded-none flex items-center justify-center">
                  <div className="h-0.5 xs:h-1 sm:h-1.5 md:h-2 w-6 xs:w-8 sm:w-10 md:w-12 bg-coral/30 rounded-none" />
                </div>
              </m.div>

              {/* Floating Stat Cards - Brutalist teal cards - Positioned around illustration */}
              {stats.map((stat, i) => (
                <m.div
                  key={stat.label}
                  initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20, y: 20 }}
                  whileInView={{ opacity: 1, x: 0, y: 0 }}
                  whileHover={{ y: -4, boxShadow: '6px 6px 0px #000', x: -2 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 + stat.delay, duration: 0.6 }}
                  className={`absolute p-2 xs:p-2.5 sm:p-3 md:p-4 rounded-none bg-teal border-2 border-black shadow-[4px_4px_0px_#000] flex items-center gap-1 xs:gap-1.5 sm:gap-2 md:gap-4 z-20 min-w-[80px] xs:min-w-[90px] sm:min-w-[100px] transition-all duration-200 ${
                    i === 0 ? 'top-0 xs:top-2 sm:top-4 md:top-8 left-4 xs:left-6 sm:left-10 md:left-16' :
                    i === 1 ? 'top-0 xs:top-2 sm:top-4 md:top-8 right-4 xs:right-6 sm:right-10 md:right-16' :
                    i === 2 ? 'bottom-0 xs:bottom-2 sm:bottom-4 md:bottom-8 left-4 xs:left-6 sm:left-10 md:left-16' :
                    'bottom-0 xs:bottom-2 sm:bottom-4 md:bottom-8 right-4 xs:right-6 sm:right-10 md:right-16'
                  }`}
                >
                  <div className="flex items-center justify-center flex-shrink-0">
                    <stat.icon size={12} className="text-white" />
                    <stat.icon size={14} className="text-white hidden xs:block sm:hidden" />
                    <stat.icon size={16} className="text-white hidden sm:block md:hidden" />
                    <stat.icon size={20} className="text-white hidden md:block" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] xs:text-[10px] sm:text-xs md:text-sm font-black text-white leading-tight truncate font-mono">{stat.value}</p>
                    <p className="text-[7px] xs:text-[8px] sm:text-[9px] md:text-[10px] uppercase tracking-widest font-bold text-white/80 mt-0.5">{stat.label}</p>
                  </div>
                </m.div>
              ))}
            </div>
          </div>

          {/* Right: Content - Brutalist styling */}
          <div className="flex-1 text-center lg:text-left w-full order-1 lg:order-2">
            <h2 className="font-dela text-2xl xs:text-3xl md:text-4xl lg:text-5xl tracking-tight mb-4 xs:mb-6 sm:mb-8 leading-[1.1] px-2 xs:px-0 text-ink">
              One Link. <br className="hidden xs:block" />
              <span className="text-coral italic">All Your Clients.</span>
            </h2>
            <p className="text-sm xs:text-base sm:text-lg text-gray-600 mb-8 xs:mb-10 sm:mb-12 max-w-xl mx-auto lg:mx-0 leading-relaxed px-2 xs:px-0 font-mono">
              AuthHub centralizes every client platform connection into a single dashboard.
              Manage permissions, monitor token health, and scale your agency without the
              manual OAuth headache.
            </p>

            {/* Bento grid feature cards */}
            <div className="hidden sm:grid grid-cols-1 sm:grid-cols-2 gap-4 xs:gap-6 sm:gap-8 max-w-lg mx-auto lg:mx-0 mb-8 xs:mb-10 sm:mb-0">
              <div className="space-y-1.5 xs:space-y-2 sm:space-y-3 p-4 border-2 border-black bg-white shadow-[4px_4px_0px_#000] rounded-none hover:shadow-[6px_6px_0px_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-200">
                <div className="flex items-center justify-center lg:justify-start">
                  <BarChart3Icon size={18} className="text-ink xs:hidden" />
                  <BarChart3Icon size={20} className="text-ink hidden xs:block sm:hidden" />
                  <BarChart3Icon size={24} className="text-ink hidden sm:block" />
                </div>
                <h3 className="font-black text-sm xs:text-base sm:text-lg uppercase tracking-wider">Scale Faster</h3>
                <p className="text-xs xs:text-sm text-gray-600 leading-relaxed font-mono">
                  Onboard 10x more clients without adding headcount.
                </p>
              </div>
              <div className="space-y-1.5 xs:space-y-2 sm:space-y-3 p-4 border-2 border-black bg-white shadow-[4px_4px_0px_#000] rounded-none hover:shadow-[6px_6px_0px_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-200">
                <div className="flex items-center justify-center lg:justify-start">
                  <ZapIcon size={18} className="text-ink xs:hidden" />
                  <ZapIcon size={20} className="text-ink hidden xs:block sm:hidden" />
                  <ZapIcon size={24} className="text-ink hidden sm:block" />
                </div>
                <h3 className="font-black text-sm xs:text-base sm:text-lg uppercase tracking-wider">Automated Onboarding</h3>
                <p className="text-xs xs:text-sm text-gray-600 leading-relaxed font-mono">
                  Replace 2-3 days of back-and-forth emails with 5-minute flow.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
