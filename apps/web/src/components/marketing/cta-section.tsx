'use client';

import { SignUpButton } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { ArrowRightIcon, CheckIcon } from '@/components/ui/ui-icons';
import { motion } from 'framer-motion';

export function CTASection() {
  return (
    <section className="py-24 sm:py-32 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative rounded-[3rem] bg-card border border-border/60 p-12 sm:p-24 overflow-hidden text-center shadow-2xl"
        >
          {/* Background Accents (Subtle) */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[120px] translate-x-1/3 -translate-y-1/3" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/5 rounded-full blur-[100px] -translate-x-1/3 translate-y-1/3" />

          <div className="relative z-10 max-w-3xl mx-auto">
            <h2 className="font-display text-4xl sm:text-6xl tracking-tight mb-8 leading-[1.1] text-foreground">
              Stop chasing access. <br />
              <span className="text-primary italic">Start scaling.</span>
            </h2>
            <p className="text-xl sm:text-2xl mb-12 text-muted-foreground leading-relaxed">
              Join 2,400+ agencies saving hundreds of hours 
              every month with AuthHub.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-12">
              <SignUpButton mode="modal">
                <Button 
                  variant="primary" 
                  size="xl" 
                  className="rounded-full w-full sm:w-auto px-12"
                  rightIcon={<ArrowRightIcon size={20} />}
                >
                  Start 14-Day Free Trial
                </Button>
              </SignUpButton>
              <Button 
                variant="secondary" 
                size="xl" 
                className="rounded-full font-bold uppercase tracking-widest text-xs"
              >
                Schedule a Demo
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-8 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckIcon size={16} color="rgb(var(--primary))" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckIcon size={16} color="rgb(var(--primary))" />
                <span>Unlimited clients</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckIcon size={16} color="rgb(var(--primary))" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
