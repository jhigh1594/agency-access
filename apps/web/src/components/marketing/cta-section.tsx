'use client';

import { SignUpButton } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { ArrowRightIcon, CheckIcon } from '@/components/ui/ui-icons';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export function CTASection() {
  const [hasScrolled, setHasScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show button after scrolling more than 50px
      if (window.scrollY > 50) {
        setHasScrolled(true);
      } else {
        setHasScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  return (
    <section className="py-16 sm:py-20 md:py-24 lg:py-32 bg-white relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative rounded-2xl sm:rounded-[3rem] bg-card border border-border/60 p-8 sm:p-12 md:p-16 lg:p-24 overflow-hidden text-center shadow-2xl"
        >
          {/* Background Accents (Subtle) */}
          <div className="absolute top-0 right-0 w-64 h-64 sm:w-96 sm:h-96 bg-primary/5 rounded-full blur-[80px] sm:blur-[120px] translate-x-1/3 -translate-y-1/3" />
          <div className="absolute bottom-0 left-0 w-48 h-48 sm:w-64 sm:h-64 bg-secondary/5 rounded-full blur-[60px] sm:blur-[100px] -translate-x-1/3 translate-y-1/3" />

          <div className="relative z-10 max-w-3xl mx-auto">
            {/* Headline - Better mobile sizing */}
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl tracking-tight mb-6 sm:mb-8 leading-[1.1] text-foreground">
              Stop chasing access.{' '}
              <span className="text-primary italic">Start scaling.</span>
            </h2>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl mb-8 sm:mb-12 text-muted-foreground leading-relaxed px-2">
              Join 2,400+ agencies saving hundreds of hours
              every month with AuthHub.
            </p>

            {/* CTAs - Full width on mobile */}
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center mb-8 sm:mb-12 px-2">
              <SignUpButton mode="modal">
                <Button
                  variant="primary"
                  size="xl"
                  className="rounded-full w-full sm:w-auto px-8 sm:px-12 shadow-xl sm:shadow-2xl"
                  rightIcon={<ArrowRightIcon size={20} />}
                >
                  Start 14-Day Free Trial
                </Button>
              </SignUpButton>
              <Button
                variant="secondary"
                size="xl"
                className="rounded-full font-bold uppercase tracking-widest text-xs w-full sm:w-auto"
              >
                Schedule a Demo
              </Button>
            </div>

            {/* Trust Badges - Better mobile spacing */}
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 md:gap-8 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-muted-foreground">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <CheckIcon size={14} className="sm:hidden" color="rgb(var(--primary))" />
                <CheckIcon size={16} className="hidden sm:block" color="rgb(var(--primary))" />
                <span className="hidden xs:inline">No credit card required</span>
                <span className="xs:hidden">No card required</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <CheckIcon size={14} className="sm:hidden" color="rgb(var(--primary))" />
                <CheckIcon size={16} className="hidden sm:block" color="rgb(var(--primary))" />
                <span>Unlimited clients</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <CheckIcon size={14} className="sm:hidden" color="rgb(var(--primary))" />
                <CheckIcon size={16} className="hidden sm:block" color="rgb(var(--primary))" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Sticky Mobile CTA Button - Shows after scrolling starts */}
      <div 
        className={`fixed bottom-0 left-0 right-0 z-40 p-4 bg-gradient-to-t from-background via-background to-transparent md:hidden pointer-events-none transition-all duration-300 ${
          hasScrolled 
            ? 'opacity-100 translate-y-0' 
            : 'opacity-0 translate-y-full pointer-events-none'
        }`}
      >
        <div className="pointer-events-auto">
          <SignUpButton mode="modal">
            <Button
              variant="primary"
              size="lg"
              className="w-full rounded-full shadow-2xl touch-feedback-bounce"
              rightIcon={<ArrowRightIcon size={18} />}
            >
              Start Free Trial
            </Button>
          </SignUpButton>
        </div>
      </div>
    </section>
  );
}
