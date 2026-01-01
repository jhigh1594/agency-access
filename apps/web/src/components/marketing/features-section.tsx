'use client';

import { Link2, Zap, Shield, Grid3x3 } from 'lucide-react';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

const features: Array<{
  icon: LucideIcon;
  title: string;
  description: string;
  mockup: React.ReactNode;
}> = [
  {
    icon: Link2,
    title: 'Single Branded Link',
    description: 'Send clients one link that handles all platform authorizations. Customize with your agency branding.',
    mockup: (
      <div className="w-full h-full bg-warm-gray/30 rounded-lg p-2 space-y-2 border border-border/50">
        <div className="h-2 w-3/4 bg-primary/20 rounded" />
        <div className="h-8 w-full bg-white rounded-md border border-border/50 shadow-sm flex items-center px-2">
          <div className="h-1 w-full bg-warm-gray rounded" />
        </div>
        <div className="h-6 w-full bg-primary rounded-md shadow-sm" />
      </div>
    )
  },
  {
    icon: Zap,
    title: '5-Minute Setup',
    description: 'Replace 2-3 days of back-and-forth emails with an automated flow. Clients complete authorization in minutes.',
    mockup: (
      <div className="w-full h-full bg-warm-gray/30 rounded-lg p-3 flex flex-col justify-center gap-2 border border-border/50">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex gap-2 items-center">
            <div className={`w-4 h-4 rounded-full ${i === 1 ? 'bg-secondary' : 'bg-border'} flex items-center justify-center`}>
              <div className="w-1.5 h-1.5 bg-white rounded-full" />
            </div>
            <div className="h-1.5 w-full bg-warm-gray rounded" />
          </div>
        ))}
      </div>
    )
  },
  {
    icon: Shield,
    title: 'Secure OAuth Tokens',
    description: 'No more password sharing. All tokens stored securely in Infisical with audit logging. Enterprise-grade security.',
    mockup: (
      <div className="w-full h-full bg-warm-gray/30 rounded-lg p-3 space-y-3 border border-border/50">
        <div className="flex justify-center">
          <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center border border-secondary/20">
            <Shield size={16} className="text-secondary" />
          </div>
        </div>
        <div className="space-y-1.5">
          <div className="h-1 w-full bg-warm-gray rounded" />
          <div className="h-1 w-5/6 bg-warm-gray rounded" />
        </div>
      </div>
    )
  },
  {
    icon: Grid3x3,
    title: 'Multi-Platform Support',
    description: 'Meta Ads, Google Ads, GA4, LinkedIn, TikTok, and more. One flow, all platforms, all your assets.',
    mockup: (
      <div className="w-full h-full bg-warm-gray/30 rounded-lg p-2 grid grid-cols-2 gap-2 border border-border/50">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-full bg-white rounded border border-border/50 flex items-center justify-center p-1">
            <div className="w-full h-1 bg-warm-gray/50 rounded" />
          </div>
        ))}
      </div>
    )
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-16 sm:py-20 md:py-24 lg:py-32 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header - Better mobile spacing */}
        <div className="max-w-2xl mx-auto text-center mb-12 sm:mb-16 md:mb-20 px-4">
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl tracking-tight mb-4 sm:mb-6">
            Everything You Need
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            Built specifically for marketing agencies who need fast, secure client onboarding.
          </p>
        </div>

        {/* Features Grid - Mobile optimized */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-5xl mx-auto">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="clean-card p-6 sm:p-8 flex flex-col sm:flex-row gap-6 sm:gap-8 group"
            >
              <div className="flex-1">
                <div className="mb-4 sm:mb-6 group-hover:scale-105 transition-transform duration-300">
                  <feature.icon size={28} className="sm:hidden text-foreground" strokeWidth={1.5} />
                  <feature.icon size={32} className="hidden sm:block text-foreground" strokeWidth={1.5} />
                </div>
                <h3 className="font-bold text-lg sm:text-xl mb-2 sm:mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed text-sm">{feature.description}</p>
              </div>

              {/* Mobile mockup - smaller but visible */}
              <div className="w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0 mx-auto sm:mx-0">
                <div className="w-full h-full group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-500">
                  {feature.mockup}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
