'use client';

import { motion } from 'framer-motion';
import { ShieldCheckIcon, ZapIcon, UsersIcon, BarChart3Icon } from '@/components/ui/ui-icons';

const stats = [
  { value: "2,400+", label: "Agencies", icon: UsersIcon, delay: 0.1 },
  { value: "5 min", label: "Avg Setup", icon: ZapIcon, delay: 0.2 },
  { value: "99.9%", label: "Success Rate", icon: ShieldCheckIcon, delay: 0.3 },
  { value: "8+", label: "Platforms", icon: BarChart3Icon, delay: 0.4 },
];

export function SolutionSection() {
  return (
    <section className="py-16 pb-32 sm:py-20 sm:pb-28 md:py-24 md:pb-32 lg:py-28 xl:py-32 overflow-hidden bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-12 sm:gap-12 md:gap-16 lg:gap-24">
          {/* Left: Isometric Layers - Replaces feature cards on mobile, appears below text on mobile */}
          <div className="flex-1 relative w-full h-[450px] xs:h-[400px] sm:h-[480px] md:h-[560px] lg:h-[500px] order-2 lg:order-1 mt-8 sm:mt-0">
            <div className="absolute inset-0 flex items-center justify-center">
              {/* Layer 3 (Bottom) */}
              <motion.div
                initial={{ opacity: 0, y: 40, rotateX: 45, rotateZ: -10 }}
                whileInView={{ opacity: 0.3, y: 60, rotateX: 45, rotateZ: -10 }}
                viewport={{ once: true }}
                className="absolute w-40 h-52 xs:w-48 xs:h-60 sm:w-64 sm:h-80 bg-warm-gray border border-border rounded-xl sm:rounded-2xl shadow-sm translate-x-4 xs:translate-x-6 sm:translate-x-10"
              />

              {/* Layer 2 (Middle) */}
              <motion.div
                initial={{ opacity: 0, y: 20, rotateX: 45, rotateZ: -10 }}
                whileInView={{ opacity: 0.6, y: 30, rotateX: 45, rotateZ: -10 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="absolute w-40 h-52 xs:w-48 xs:h-60 sm:w-64 sm:h-80 bg-white border border-border rounded-xl sm:rounded-2xl shadow-md translate-x-2 xs:translate-x-3 sm:translate-x-5"
              />

              {/* Layer 1 (Top) */}
              <motion.div
                initial={{ opacity: 0, y: 0, rotateX: 45, rotateZ: -10 }}
                whileInView={{ opacity: 1, y: 0, rotateX: 45, rotateZ: -10 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="absolute w-40 h-52 xs:w-48 xs:h-60 sm:w-64 sm:h-80 bg-white border border-primary/20 rounded-xl sm:rounded-2xl shadow-xl z-10 flex flex-col p-3 xs:p-4 sm:p-6 gap-1.5 xs:gap-2 sm:gap-4"
              >
                <div className="h-2.5 xs:h-3 sm:h-4 w-3/4 bg-warm-gray rounded" />
                <div className="h-16 xs:h-20 sm:h-32 w-full bg-warm-gray/50 rounded-lg sm:rounded-xl" />
                <div className="space-y-1 xs:space-y-1.5 sm:space-y-2">
                  <div className="h-1.5 xs:h-2 sm:h-3 w-full bg-warm-gray rounded" />
                  <div className="h-1.5 xs:h-2 sm:h-3 w-5/6 bg-warm-gray rounded" />
                </div>
                <div className="mt-auto h-6 xs:h-8 sm:h-10 w-full bg-primary/10 rounded-md sm:rounded-lg flex items-center justify-center">
                  <div className="h-1 xs:h-1.5 sm:h-2 w-8 xs:w-10 sm:w-12 bg-primary/30 rounded" />
                </div>
              </motion.div>

              {/* Floating Stat Cards - Better mobile positioning with safe margins */}
              {stats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20, y: 20 }}
                  whileInView={{ opacity: 1, x: 0, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 + stat.delay, duration: 0.6 }}
                  className={`absolute p-2.5 xs:p-3 sm:p-4 rounded-lg xs:rounded-xl sm:rounded-2xl bg-white/90 backdrop-blur-md border border-border shadow-lg flex items-center gap-1.5 xs:gap-2 sm:gap-4 z-20 max-w-[120px] xs:max-w-none ${
                    i === 0 ? 'top-2 xs:top-4 sm:top-10 left-1 xs:left-2 sm:left-0' :
                    i === 1 ? 'top-8 xs:top-12 sm:top-20 right-1 xs:right-2 sm:right-0' :
                    i === 2 ? 'bottom-2 xs:bottom-4 sm:bottom-10 left-2 xs:left-4 sm:left-4' :
                    'bottom-8 xs:bottom-12 sm:bottom-20 right-2 xs:right-4 sm:right-4'
                  }`}
                >
                  <div className="flex items-center justify-center flex-shrink-0">
                    <stat.icon size={14} className="text-foreground xs:hidden" />
                    <stat.icon size={16} className="text-foreground hidden xs:block sm:hidden" />
                    <stat.icon size={20} className="text-foreground hidden sm:block" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] xs:text-xs sm:text-sm font-bold text-foreground leading-tight xs:leading-none truncate">{stat.value}</p>
                    <p className="text-[8px] xs:text-[9px] sm:text-[10px] uppercase tracking-wider xs:tracking-widest font-bold text-muted-foreground mt-0.5 xs:mt-1 line-clamp-1">{stat.label}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Right: Content - appears first on mobile */}
          <div className="flex-1 text-center lg:text-left w-full order-1 lg:order-2">
            <h2 className="font-display text-2xl xs:text-3xl md:text-4xl lg:text-5xl tracking-tight mb-4 xs:mb-6 sm:mb-8 leading-[1.1] px-2 xs:px-0">
              One Link. <br className="hidden xs:block" />
              <span className="text-primary italic">All Your Clients.</span>
            </h2>
            <p className="text-sm xs:text-base sm:text-lg text-muted-foreground mb-8 xs:mb-10 sm:mb-12 max-w-xl mx-auto lg:mx-0 leading-relaxed px-2 xs:px-0">
              AuthHub centralizes every client platform connection into a single dashboard.
              Manage permissions, monitor token health, and scale your agency without the
              manual OAuth headache.
            </p>

            <div className="hidden sm:grid grid-cols-1 sm:grid-cols-2 gap-4 xs:gap-6 sm:gap-8 max-w-lg mx-auto lg:mx-0 mb-8 xs:mb-10 sm:mb-0">
              <div className="space-y-1.5 xs:space-y-2 sm:space-y-3">
                <div className="flex items-center justify-center lg:justify-start">
                  <ShieldCheckIcon size={18} className="text-foreground xs:hidden" />
                  <ShieldCheckIcon size={20} className="text-foreground hidden xs:block sm:hidden" />
                  <ShieldCheckIcon size={24} className="text-foreground hidden sm:block" />
                </div>
                <h3 className="font-bold text-sm xs:text-base sm:text-lg">Secure by Design</h3>
                <p className="text-xs xs:text-sm text-muted-foreground leading-relaxed">
                  Enterprise-grade encryption and automated secrets management.
                </p>
              </div>
              <div className="space-y-1.5 xs:space-y-2 sm:space-y-3">
                <div className="flex items-center justify-center lg:justify-start">
                  <BarChart3Icon size={18} className="text-foreground xs:hidden" />
                  <BarChart3Icon size={20} className="text-foreground hidden xs:block sm:hidden" />
                  <BarChart3Icon size={24} className="text-foreground hidden sm:block" />
                </div>
                <h3 className="font-bold text-sm xs:text-base sm:text-lg">API-First Access</h3>
                <p className="text-xs xs:text-sm text-muted-foreground leading-relaxed">
                  Get immediate JSON responses for Meta, Google Ads, and more.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
