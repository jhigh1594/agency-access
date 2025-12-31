'use client';

import { SignUpButton } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { ArrowRight, Check } from 'lucide-react';

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-background py-24 sm:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          {/* Badge */}
          <div className="mb-8 inline-flex items-center rounded-full border border-border bg-card px-4 py-2 text-sm font-medium">
            <span className="mr-2">✨</span>
            Replace 2-3 days of manual setup with a 5-minute flow
          </div>

          {/* Headline */}
          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl tracking-tight mb-6">
            OAuth Onboarding
            <br />
            <span className="text-primary">That Actually Works</span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Let clients authorize Meta, Google Ads, GA4, LinkedIn, and more through a single
            branded link. No more password sharing, confusing instructions, or 3-day delays.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <SignUpButton mode="modal">
              <Button variant="primary" size="xl" rightIcon={<ArrowRight className="w-5 h-5" />}>
                Start Free Trial
              </Button>
            </SignUpButton>
            <Button variant="secondary" size="xl">
              Watch Demo
            </Button>
          </div>

          {/* Social Proof */}
          <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-success" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-success" />
              <span>5-minute setup</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-success" />
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>

        {/* Hero Visual Placeholder */}
        <div className="mt-16 mx-auto max-w-5xl">
          <div className="relative rounded-2xl border border-border bg-card p-8 shadow-2xl">
            <div className="aspect-video bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg flex items-center justify-center">
              <p className="text-muted-foreground font-mono-label">Dashboard Preview</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

