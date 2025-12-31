'use client';

import { SignUpButton } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import Image from 'next/image';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

export function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-24 pb-32 sm:pt-32 sm:pb-40">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
          {/* Left: Content */}
          <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="flex-1 text-left"
          >
            <motion.div variants={item} className="mb-6 inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
              <span className="mr-2">✨</span>
              Client access in 5 minutes. Not 5 days.
            </motion.div>

            <motion.h1 variants={item} className="font-display text-5xl sm:text-6xl lg:text-7xl tracking-tight text-foreground mb-8 leading-[1.1]">
              OAuth Onboarding
              <br />
              <span className="text-primary">That Actually Works</span>
            </motion.h1>

            <motion.p variants={item} className="text-xl text-muted-foreground mb-10 max-w-xl leading-relaxed">
              AuthHub replaces the 47-email onboarding saga with a single branded link. 
              Clients click, you connect, everyone's happy.
            </motion.p>

            <motion.div variants={item} className="flex flex-col sm:flex-row gap-4 items-start mb-12">
              <SignUpButton mode="modal">
                <Button variant="primary" size="xl" rightIcon={<ArrowRight className="w-5 h-5" />}>
                  Start Free Trial
                </Button>
              </SignUpButton>
              <Button variant="secondary" size="xl">
                Watch Demo
              </Button>
            </motion.div>

            {/* Platform Logos Staggered */}
            <motion.div variants={item} className="flex flex-wrap items-center gap-8 opacity-70">
              <span className="text-sm font-mono text-muted-foreground uppercase tracking-widest font-medium">Supports</span>
              <div className="flex gap-6 items-center grayscale opacity-50">
                <span className="font-bold">Meta</span>
                <span className="font-bold">Google</span>
                <span className="font-bold">LinkedIn</span>
                <span className="font-bold">TikTok</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Right: Illustration */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="flex-1 relative w-full max-w-2xl"
          >
            <div className="animate-float">
              <Image 
                src="/illustrations/hero-illustration.svg" 
                alt="AuthHub Illustration" 
                width={600} 
                height={500} 
                className="w-full h-auto drop-shadow-2xl"
                priority
              />
            </div>
            
            {/* Accents */}
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-accent/20 rounded-full blur-3xl animate-pulse" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-secondary/10 rounded-full blur-3xl animate-pulse delay-700" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
