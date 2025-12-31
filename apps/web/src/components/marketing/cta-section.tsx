'use client';

import { SignUpButton } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export function CTASection() {
  return (
    <section className="py-24 sm:py-32 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/5 to-accent/5 p-12 text-center">
            <h2 className="font-display text-4xl sm:text-5xl tracking-tight mb-4">
              Ready to Streamline Onboarding?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join agencies that have eliminated the biggest bottleneck in client onboarding.
              Start your free trial today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <SignUpButton mode="modal">
                <Button variant="primary" size="xl" rightIcon={<ArrowRight className="w-5 h-5" />}>
                  Start Free Trial
                </Button>
              </SignUpButton>
              <Button variant="secondary" size="xl">
                Schedule Demo
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-6">
              No credit card required • 5-minute setup • Cancel anytime
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

