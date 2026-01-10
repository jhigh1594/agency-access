'use client';

import { SignUpButton } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { GlobeIcon, ShieldCheckIcon, ZapIcon } from '@/components/ui/ui-icons';
import { TrendingUp, Clock, Sparkles, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { Reveal } from './reveal';
export function HeroSection() {
  return (
    <section className="relative min-h-screen overflow-hidden bg-paper border-b-2 border-black">
      {/* Diagonal lines background pattern */}
      <div className="absolute inset-0 opacity-30 pointer-events-none -z-10 diagonal-lines" />

      {/* Noise texture overlay */}
      <div className="absolute inset-0 opacity-5 pointer-events-none -z-10"
           style={{
             backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")`
           }}
      />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-16 items-center">
          {/* Left Column - Content */}
          <div className="lg:col-span-7 flex flex-col items-start gap-6 z-10 text-center lg:text-left">
            {/* Badge - Tilted with rotation */}
            <Reveal delay={0.2}>
              <div className="inline-flex items-center gap-2 border-2 border-black bg-ink text-paper px-4 sm:px-6 py-2 text-[10px] sm:text-xs font-bold uppercase tracking-widest font-mono shadow-brutalist -rotate-2 hover:rotate-0 transition-transform rounded-[0.75rem]">
                <GlobeIcon size={14} />
                #1 Client Access Platform
              </div>
            </Reveal>

            {/* Main Headline - Tighter leading, glitch effect */}
            <Reveal delay={0.3}>
              <h1 className="font-dela text-4xl sm:text-5xl md:text-6xl lg:text-7xl !leading-[1.1] tracking-tight text-ink relative">
                <div className="mb-2 sm:mb-3 md:mb-4">
                  <span className="glitch-text inline-block">CLIENT ACCESS</span>
                </div>
                <div className="mb-2 sm:mb-3 md:mb-4 relative inline-block">
                  <span className="glitch-text inline-block">IN 5 MINUTES</span>
                  <svg
                    className="absolute -bottom-6 md:-bottom-8 left-0 w-full"
                    viewBox="0 0 200 16"
                    fill="none"
                    style={{ marginTop: '8px' }}
                  >
                    <motion.path
                      d="M2 10Q100 -2 198 10"
                      stroke="rgb(var(--coral))"
                      strokeWidth="6"
                      strokeLinecap="round"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 1.5, delay: 1 }}
                    />
                  </svg>
                </div>
                <div>
                  <span className="glitch-text inline-block">NOT 5 DAYS</span>
                </div>
              </h1>
            </Reveal>

            {/* Subheadline */}
            <Reveal delay={0.4}>
              <p className="font-mono text-lg sm:text-xl md:text-2xl max-w-xl mx-auto lg:mx-0 leading-tight opacity-90 mt-4 text-ink">
                Join <span className="font-bold">50+ agencies</span> saving <span className="text-ink font-bold bg-teal/20 px-1 mx-1">hundreds of hours</span> every month.
                Replace <span className="font-bold">47-email onboarding</span> with a <span className="text-ink font-bold bg-acid/20 px-1 mx-1">single link</span>.
              </p>
            </Reveal>

            {/* CTAs */}
            <Reveal delay={0.5}>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full max-w-md mx-auto lg:mx-0 mt-6">
                <SignUpButton mode="modal">
                  <Button variant="brutalist-rounded" size="xl" className="flex-1 sm:flex-none text-center min-w-[180px]" rightIcon={<ZapIcon size={18} />}>
                    Start Free Trial
                  </Button>
                </SignUpButton>
                <Button 
                  variant="brutalist-ghost-rounded" 
                  size="xl" 
                  className="flex-1 sm:flex-none text-center min-w-[180px]"
                  data-cal-link="pillar-ai/authhub-demo"
                  data-cal-namespace="authhub-demo"
                  data-cal-config='{"layout":"month_view","theme":"light"}'
                >
                  Schedule Demo
                </Button>
              </div>
            </Reveal>

            {/* Trust Badge with avatars */}
            <Reveal delay={0.6}>
              <div className="flex items-center gap-4 text-sm font-bold mt-8 border-l-4 border-acid pl-4 text-ink justify-center lg:justify-start">
                <div className="flex -space-x-3">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="w-10 h-10 rounded-[0.75rem] border-2 border-paper bg-gray-300 overflow-hidden"
                    >
                      <div className="w-full h-full bg-teal flex items-center justify-center text-white text-xs font-bold">
                        {String.fromCharCode(64 + i)}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="leading-tight">
                  Trusted by <br />
                  <span className="underline decoration-coral decoration-2">
                    50+ Marketing Agencies
                  </span>
                </p>
              </div>
            </Reveal>
          </div>

          {/* Right Column - Dashboard Mockup with Floating Cards */}
          <div className="lg:col-span-5 relative mt-12 lg:mt-0 min-h-[400px] lg:min-h-[600px] flex items-center justify-center order-first lg:order-last">
            {/* Background shapes */}
            <div
              className="absolute inset-0 bg-acid rounded-[3rem] border-3 border-black rotate-3 z-0 shadow-hard-xl opacity-20 animate-pulse"
              style={{ animationDuration: '4s' }}
            />
            <div className="absolute inset-0 border-2 border-black border-dashed rounded-[3rem] -rotate-3 z-0" />

            {/* Floating Card 1 - Top Right */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.2 }}
              className="absolute top-10 right-0 z-20 animate-float-pillar bg-paper border-2 border-black p-4 rounded-xl shadow-brutalist max-w-[200px] rotate-6 group"
            >
              <div className="flex items-center gap-3">
                <div className="bg-teal/20 p-2 rounded-lg border border-black text-teal">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div className="text-ink">
                  <div className="font-dela text-sm">Avg. Savings</div>
                  <div className="text-xs font-mono">10x Faster</div>
                </div>
              </div>
            </motion.div>

            {/* Floating Card 2 - Bottom Left */}
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.4, type: 'spring' }}
              className="absolute bottom-20 -left-4 z-20 animate-float-pillar bg-ink text-paper border-2 border-black px-4 py-2 rounded-[0.75rem] shadow-brutalist -rotate-6"
              style={{ animationDelay: '1s' }}
            >
              <div className="flex items-center gap-2 font-dela text-sm">
                <Check className="w-4 h-4" /> Request Received. Access Granted
              </div>
            </motion.div>

            {/* Main Dashboard Preview */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8, duration: 0.8 }}
              className="relative bg-paper rounded-[2rem] border-2 border-black overflow-hidden z-10 w-full aspect-[4/5] shadow-hard-xl group"
            >
              {/* Dashboard mockup */}
              <div className="absolute inset-0 p-6">
                {/* Window Controls */}
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-3 h-3 rounded-full bg-black" />
                  <div className="w-3 h-3 rounded-full bg-black" />
                  <div className="w-3 h-3 rounded-full bg-black" />
                </div>

                {/* OAuth Authorization Card */}
                <div className="border-2 border-black bg-white rounded-none p-6 shadow-brutalist-sm">
                  <div className="flex items-center justify-center mb-6">
                    <div className="w-16 h-16 border-2 border-black bg-coral flex items-center justify-center text-white shadow-brutalist relative">
                      <GlobeIcon size={32} />
                      <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-acid border-2 border-black animate-pulse" />
                    </div>
                  </div>
                  <h3 className="text-center font-dela text-2xl md:text-3xl mb-2 text-ink">Connect Your Platforms</h3>
                  <p className="text-center text-gray-600 mb-6 text-sm font-mono">AuthHub is requesting access to:</p>
                  <div className="space-y-3 mb-6">
                    {['Meta Ads', 'Google Ads', 'GA4', 'LinkedIn Ads'].map(p => (
                      <div key={p} className="flex items-center justify-between p-3 border-2 border-black bg-gray-50 rounded-none shadow-brutalist-sm">
                        <span className="text-sm font-bold text-ink">{p}</span>
                        <div className="w-5 h-5 rounded-[0.5rem] bg-teal/20 border-2 border-black flex items-center justify-center flex-shrink-0">
                          <ShieldCheckIcon size={14} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button variant="brutalist-rounded" className="w-full h-12 text-sm font-bold group-hover:shadow-none group-hover:translate-x-[2px] group-hover:translate-y-[2px] transition-all">
                    Grant Access
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
