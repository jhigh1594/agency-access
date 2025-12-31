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
    <section className="py-24 sm:py-32 overflow-hidden bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
          {/* Left: Isometric Layers */}
          <div className="flex-1 relative w-full h-[400px] sm:h-[500px]">
            <div className="absolute inset-0 flex items-center justify-center">
              {/* Layer 3 (Bottom) */}
              <motion.div 
                initial={{ opacity: 0, y: 40, rotateX: 45, rotateZ: -10 }}
                whileInView={{ opacity: 0.3, y: 60, rotateX: 45, rotateZ: -10 }}
                viewport={{ once: true }}
                className="absolute w-64 h-80 bg-warm-gray border border-border rounded-2xl shadow-sm translate-x-10"
              />
              
              {/* Layer 2 (Middle) */}
              <motion.div 
                initial={{ opacity: 0, y: 20, rotateX: 45, rotateZ: -10 }}
                whileInView={{ opacity: 0.6, y: 30, rotateX: 45, rotateZ: -10 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="absolute w-64 h-80 bg-white border border-border rounded-2xl shadow-md translate-x-5"
              />
              
              {/* Layer 1 (Top) */}
              <motion.div 
                initial={{ opacity: 0, y: 0, rotateX: 45, rotateZ: -10 }}
                whileInView={{ opacity: 1, y: 0, rotateX: 45, rotateZ: -10 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="absolute w-64 h-80 bg-white border border-primary/20 rounded-2xl shadow-xl z-10 flex flex-col p-6 gap-4"
              >
                <div className="h-4 w-3/4 bg-warm-gray rounded" />
                <div className="h-32 w-full bg-warm-gray/50 rounded-xl" />
                <div className="space-y-2">
                  <div className="h-3 w-full bg-warm-gray rounded" />
                  <div className="h-3 w-5/6 bg-warm-gray rounded" />
                </div>
                <div className="mt-auto h-10 w-full bg-primary/10 rounded-lg flex items-center justify-center">
                  <div className="h-2 w-12 bg-primary/30 rounded" />
                </div>
              </motion.div>
              
              {/* Floating Stat Cards */}
              {stats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20, y: 20 }}
                  whileInView={{ opacity: 1, x: 0, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 + stat.delay, duration: 0.6 }}
                  className={`absolute p-4 rounded-2xl bg-white/80 backdrop-blur-md border border-border shadow-lg flex items-center gap-4 z-20 ${
                    i === 0 ? 'top-10 -left-4 sm:left-0' :
                    i === 1 ? 'top-20 -right-4 sm:right-0' :
                    i === 2 ? 'bottom-10 -left-4 sm:left-4' :
                    'bottom-20 -right-4 sm:right-4'
                  }`}
                >
                  <div className="flex items-center justify-center">
                    <stat.icon size={20} className="text-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground leading-none">{stat.value}</p>
                    <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mt-1">{stat.label}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Right: Content */}
          <div className="flex-1">
            <h2 className="font-display text-4xl sm:text-5xl tracking-tight mb-8 leading-[1.1]">
              One Link. <br />
              <span className="text-primary italic">All Your Clients.</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-12 max-w-xl leading-relaxed">
              AuthHub centralizes every client platform connection into a single dashboard. 
              Manage permissions, monitor token health, and scale your agency without the 
              manual OAuth headache.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div className="space-y-3">
                <div className="flex items-center">
                  <ShieldCheckIcon size={24} className="text-foreground" />
                </div>
                <h3 className="font-bold">Secure by Design</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Enterprise-grade encryption and automated secrets management.
                </p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center">
                  <BarChart3Icon size={24} className="text-foreground" />
                </div>
                <h3 className="font-bold">API-First Access</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
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
