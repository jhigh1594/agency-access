'use client';

import { SignUpButton } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { ArrowRightIcon, GlobeIcon, ShieldCheckIcon } from '@/components/ui/ui-icons';
import { motion, Variants, Transition } from 'framer-motion';

const container: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemTransition: Transition = {
  duration: 0.8,
  ease: [0.22, 1, 0.36, 1],
};

const item: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: itemTransition
  },
};

export function HeroSection() {
  return (
    <section className="relative pt-20 pb-16 sm:pb-24 md:pb-32 overflow-hidden bg-background">
      {/* Background Mesh */}
      <div className="absolute inset-0 bg-warm-mesh opacity-50 -z-10" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="max-w-4xl mx-auto text-center mb-12 sm:mb-16 md:mb-20"
        >
          {/* Eyebrow */}
          <motion.div variants={item} className="mb-4 sm:mb-6 inline-flex items-center rounded-full border border-border bg-card/50 px-3 sm:px-4 py-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-muted-foreground shadow-sm">
            <span className="w-2 h-2 rounded-full bg-primary mr-2 animate-pulse" />
            <span className="hidden sm:inline">Join 2,400+ marketing agencies</span>
            <span className="sm:hidden">2,400+ agencies</span>
          </motion.div>

          {/* Headline - Fluid typography for mobile */}
          <motion.h1 variants={item} className="font-display text-fluid-hero tracking-tight text-foreground mb-6 sm:mb-8">
            Client Access in{' '}
            <span className="italic text-primary">5 Minutes.</span> Not 5 Days.
          </motion.h1>

          {/* Subheadline - Reduced mobile size for readability */}
          <motion.p variants={item} className="text-fluid-lg text-muted-foreground mb-8 sm:mb-12 max-w-2xl mx-auto leading-relaxed font-medium px-4">
            The easy button for agency access to client accounts. Replace 47-email onboarding
            sagas with a single branded link.
          </motion.p>

          {/* CTAs */}
          <motion.div variants={item} className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center px-4">
            <SignUpButton mode="modal">
              <Button variant="primary" size="xl" className="rounded-full shadow-2xl shadow-primary/20 w-full sm:w-auto" rightIcon={<ArrowRightIcon size={20} />}>
                Start Free Trial
              </Button>
            </SignUpButton>
            <Button variant="ghost" size="xl" className="rounded-full font-bold uppercase tracking-widest text-xs w-full sm:w-auto">
              Watch Demo
            </Button>
          </motion.div>
        </motion.div>

        {/* Dashboard Mockup (CSS Only) */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative max-w-5xl mx-auto px-4"
        >
          {/* Main Dashboard */}
          <div className="relative bg-white border border-border rounded-2xl sm:rounded-3xl shadow-[0_32px_64px_-12px_rgba(0,0,0,0.1)] overflow-hidden aspect-[4/3] sm:aspect-[16/10] md:aspect-[16/9]">
            {/* Window Controls */}
            <div className="h-10 sm:h-12 border-b border-border bg-warm-gray/30 flex items-center px-4 sm:px-6 gap-2">
              <div className="w-3 h-3 rounded-full bg-border" />
              <div className="w-3 h-3 rounded-full bg-border" />
              <div className="w-3 h-3 rounded-full bg-border" />
            </div>

            {/* Sidebar & Content Layout */}
            <div className="flex h-[calc(100%-40px)] sm:h-[calc(100%-48px)]">
              {/* Sidebar - Hidden on very small mobile, simplified on larger mobile */}
              <div className="w-12 sm:w-16 md:w-56 border-r border-border bg-warm-gray/5 p-3 sm:p-6 space-y-4 sm:space-y-6 hidden xs:flex flex-col">
                <div className="h-5 w-8 sm:w-32 bg-border/40 rounded-full hidden md:block" />
                <div className="space-y-3 sm:space-y-4 pt-2 sm:pt-4 flex-1">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="flex gap-2 sm:gap-4 items-center">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-border/20 flex-shrink-0" />
                      <div className="h-2 w-16 sm:w-24 bg-border/10 rounded hidden md:block" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Main Area */}
              <div className="flex-1 p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8 md:space-y-10">
                {/* Header */}
                <div className="flex justify-between items-center gap-2">
                  <div className="h-6 sm:h-8 w-24 sm:w-48 bg-border/30 rounded-full" />
                  <div className="h-8 sm:h-10 w-24 sm:w-32 bg-primary/5 border border-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <div className="h-2 w-12 sm:w-16 bg-primary/20 rounded" />
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-6">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-24 sm:h-32 bg-warm-gray/10 border border-border rounded-xl sm:rounded-2xl p-3 sm:p-6 space-y-2 sm:space-y-4">
                      <div className="h-2 w-12 sm:w-16 bg-border/20 rounded" />
                      <div className="h-6 sm:h-8 w-16 sm:w-24 bg-border/30 rounded" />
                    </div>
                  ))}
                </div>

                {/* List Table */}
                <div className="space-y-2 sm:space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex gap-3 sm:gap-6 items-center h-12 sm:h-16 bg-white border border-border/40 rounded-lg sm:rounded-xl px-3 sm:px-6 shadow-sm">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-border/20 flex-shrink-0" />
                      <div className="h-2 sm:h-3 w-20 sm:w-48 bg-border/10 rounded flex-1" />
                      <div className="h-2 sm:h-3 w-12 sm:w-24 bg-border/10 rounded hidden xs:block" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Floating Glass Overlay (Client Preview) - Stacked on mobile */}
            <div className="relative sm:absolute sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 w-full max-w-[280px] sm:max-w-sm bg-white/90 backdrop-blur-xl border border-border rounded-2xl sm:rounded-[2.5rem] p-6 sm:p-10 shadow-[0_24px_48px_-12px_rgba(0,0,0,0.15)] sm:shadow-[0_48px_96px_-12px_rgba(0,0,0,0.15)] mt-6 sm:mt-0">
              <div className="flex justify-center mb-4 sm:mb-8">
                <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-primary flex items-center justify-center text-white shadow-xl sm:shadow-2xl shadow-primary/30 relative">
                  <GlobeIcon size={28} className="sm:hidden" />
                  <GlobeIcon size={40} className="hidden sm:block" />
                  <div className="absolute -top-2 -right-2 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-secondary border-4 border-white animate-bounce" />
                </div>
              </div>
              <h3 className="text-center font-display text-xl sm:text-3xl mb-2 sm:mb-3">Connect Platforms</h3>
              <p className="text-center text-muted-foreground mb-6 sm:mb-10 text-sm sm:text-base font-medium px-2">AuthHub is requesting access to:</p>
              <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-10">
                {['Meta Ads', 'Google Ads', 'GA4'].map(p => (
                  <div key={p} className="flex items-center justify-between p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-warm-gray/20 border border-border/50">
                    <span className="text-xs sm:text-sm font-bold">{p}</span>
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0">
                      <ShieldCheckIcon size={14} className="sm:hidden" color="rgb(var(--secondary))" />
                      <ShieldCheckIcon size={16} className="hidden sm:block" color="rgb(var(--secondary))" />
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="primary" className="w-full rounded-xl sm:rounded-2xl h-12 sm:h-14 text-sm sm:text-base font-bold shadow-xl shadow-primary/20">Grant Access</Button>
            </div>
          </div>

          {/* Subtle Glows */}
          <div className="absolute -bottom-12 sm:-bottom-20 left-1/2 -translate-x-1/2 w-full max-w-4xl h-32 sm:h-40 bg-primary/5 blur-[80px] sm:blur-[120px] -z-10" />
        </motion.div>
      </div>
    </section>
  );
}
