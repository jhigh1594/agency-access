'use client';

import { Link2, Zap, Shield, Grid3x3 } from 'lucide-react';
import { m } from 'framer-motion';
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
      <div className="w-full h-full bg-gray-100 rounded-none p-2 space-y-2 border-2 border-black shadow-[4px_4px_0px_#000]">
        <div className="h-2 w-3/4 bg-coral/20 rounded-none" />
        <div className="h-8 w-full bg-card rounded-none border-2 border-black flex items-center px-2">
          <div className="h-1 w-full bg-gray-200 rounded-none" />
        </div>
        <div className="h-6 w-full bg-coral rounded-none" />
      </div>
    )
  },
  {
    icon: Zap,
    title: '5-Minute Setup',
    description: 'Replace 2-3 days of back-and-forth emails with an automated flow. Clients complete authorization in minutes.',
    mockup: (
      <div className="w-full h-full bg-gray-100 rounded-none p-3 flex flex-col justify-center gap-2 border-2 border-black shadow-[4px_4px_0px_#000]">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex gap-2 items-center">
            <div className={`w-4 h-4 rounded-none border-2 border-black ${i === 1 ? 'bg-teal' : 'bg-card'} flex items-center justify-center`}>
              <div className="w-1.5 h-1.5 bg-card rounded-none" />
            </div>
            <div className="h-1.5 w-full bg-gray-200 rounded-none" />
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
      <div className="w-full h-full bg-gray-100 rounded-none p-3 space-y-3 border-2 border-black shadow-[4px_4px_0px_#000]">
        <div className="flex justify-center">
          <div className="w-8 h-8 rounded-none border-2 border-black bg-teal/20 flex items-center justify-center">
            <Shield size={16} className="text-teal" strokeWidth={2.5} />
          </div>
        </div>
        <div className="space-y-1.5">
          <div className="h-1 w-full bg-gray-200 rounded-none" />
          <div className="h-1 w-5/6 bg-gray-200 rounded-none" />
        </div>
      </div>
    )
  },
  {
    icon: Grid3x3,
    title: 'Multi-Platform Support',
    description: 'Meta Ads, Google Ads, GA4, LinkedIn, TikTok, and more. One flow, all platforms, all your assets.',
    mockup: (
      <div className="w-full h-full bg-gray-100 rounded-none p-2 grid grid-cols-2 gap-2 border-2 border-black shadow-[4px_4px_0px_#000]">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-full bg-card rounded-none border-2 border-black flex items-center justify-center p-1">
            <div className="w-full h-1 bg-gray-200 rounded-none" />
          </div>
        ))}
      </div>
    )
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-16 sm:py-20 md:py-24 lg:py-32 bg-paper">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header - Brutalist styling */}
        <div className="max-w-2xl mx-auto text-center mb-12 sm:mb-16 md:mb-20 px-4">
          <h2 className="font-dela text-3xl sm:text-4xl md:text-5xl tracking-tight mb-4 sm:mb-6 text-ink">
            Everything You Need
          </h2>
          <p className="text-base sm:text-lg text-gray-600 leading-relaxed font-mono">
            Built specifically for marketing agencies who need fast, secure client onboarding.
          </p>
        </div>

        {/* Features Grid - Checkerboard pattern with brutalist styling */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-black border-2 border-black max-w-5xl mx-auto shadow-brutalist-xl">
          {features.map((feature, i) => (
            <m.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`p-6 sm:p-8 flex flex-col sm:flex-row gap-6 sm:gap-8 group ${
                i % 2 === 0 ? 'bg-card' : 'bg-coral'
              }`}
            >
              <div className="flex-1">
                {/* Icon in brutalist bordered box */}
                <div className="mb-4 sm:mb-6 w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center border-2 border-black bg-card shadow-[4px_4px_0px_#000] group-hover:shadow-[6px_6px_0px_#000] group-hover:translate-x-[-2px] group-hover:translate-y-[-2px] transition-all duration-200 flex-shrink-0">
                  <feature.icon size={24} className="sm:hidden text-ink" strokeWidth={2.5} />
                  <feature.icon size={28} className="hidden sm:block text-ink" strokeWidth={2.5} />
                </div>
                <h3 className={`font-black text-lg sm:text-xl mb-2 sm:mb-3 uppercase tracking-wider ${i % 2 === 0 ? 'text-ink' : 'text-white'}`}>
                  {feature.title}
                </h3>
                <p className={`leading-relaxed text-sm font-mono ${i % 2 === 0 ? 'text-gray-600' : 'text-white/90'}`}>
                  {feature.description}
                </p>
              </div>

              {/* Mobile mockup - Brutalist styling */}
              <div className="w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0 mx-auto sm:mx-0">
                <div className="w-full h-full group-hover:translate-x-[-2px] group-hover:translate-y-[-2px] group-hover:shadow-[6px_6px_0px_#000] transition-all duration-200">
                  {feature.mockup}
                </div>
              </div>
            </m.div>
          ))}
        </div>
      </div>
    </section>
  );
}
