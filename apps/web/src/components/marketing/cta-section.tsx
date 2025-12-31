'use client';

import { SignUpButton } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { ArrowRight, Check } from 'lucide-react';
import { motion } from 'framer-motion';

export function CTASection() {
  return (
    <section className="py-24 sm:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative rounded-[3rem] bg-primary p-12 sm:p-24 overflow-hidden text-center text-primary-foreground shadow-2xl"
        >
          {/* Background Accents */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

          <div className="relative z-10 max-w-3xl mx-auto">
            <h2 className="font-display text-4xl sm:text-6xl tracking-tight mb-8">
              Ready to stop chasing access?
            </h2>
            <p className="text-xl sm:text-2xl mb-12 opacity-90 leading-relaxed">
              Join 2,400+ agencies who are saving hundreds of hours 
              every month with AuthHub.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-12">
              <SignUpButton mode="modal">
                <Button 
                  variant="secondary" 
                  size="xl" 
                  className="bg-white text-primary hover:bg-white/90 border-transparent w-full sm:w-auto shadow-2xl"
                  rightIcon={<ArrowRight className="w-5 h-5" />}
                >
                  Start 14-Day Free Trial
                </Button>
              </SignUpButton>
              <Button 
                variant="ghost" 
                size="xl" 
                className="text-primary-foreground hover:bg-white/10 w-full sm:w-auto"
              >
                Schedule a Demo
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-8 text-sm opacity-80 font-medium">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span>Unlimited clients</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
