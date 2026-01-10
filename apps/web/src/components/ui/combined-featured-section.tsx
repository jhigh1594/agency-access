'use client'

import { Activity, Globe, Shield, Zap } from 'lucide-react'
import { m } from 'framer-motion'

export default function CombinedFeaturedSection() {
  return (
    <section id="trusted-by-agencies" className="py-16 sm:py-20 md:py-24 border-y-2 border-black bg-paper relative overflow-hidden">
      {/* Diagonal lines background */}
      <div className="absolute inset-0 opacity-20 pointer-events-none -z-10 diagonal-lines" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <m.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 border-2 border-black bg-coral text-paper px-4 sm:px-6 py-2 text-[10px] sm:text-xs font-bold uppercase tracking-widest font-mono shadow-brutalist rounded-[0.75rem] mb-6">
            <Zap size={14} />
            Real Results
          </div>
          <h2 className="font-dela text-3xl sm:text-4xl md:text-5xl tracking-tight text-ink mb-4">
            Trusted by Growing Agencies
          </h2>
          <p className="font-mono text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
            See how agencies are transforming client onboarding from a 3-day bottleneck to a 5-minute flow.
          </p>
        </m.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">

        {/* 1. ONE LINK EVERY PLATFORM - Top Left */}
        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="p-6 sm:p-8 border-2 border-black bg-paper shadow-brutalist rounded-[0.75rem] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200 touch-feedback flex flex-col"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 border-2 border-black bg-teal flex items-center justify-center rounded-[0.5rem] flex-shrink-0">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <span className="text-xs sm:text-sm font-bold uppercase tracking-wide text-ink">Simplified Onboarding</span>
          </div>
          <h3 className="font-dela text-xl sm:text-2xl text-ink mb-3">
            One Link. Every Platform.
          </h3>
          <p className="text-sm leading-relaxed mb-6 text-gray-700">
            Send clients a single branded authorization link. They connect Meta, Google, TikTok, and LinkedIn in one 5-minute flow.
          </p>

          {/* Platform badges */}
          <div className="flex flex-wrap gap-2 mb-2">
            {['Meta Ads', 'Google Ads', 'GA4', 'TikTok', 'LinkedIn'].map((platform, i) => (
              <span key={platform} className="px-3 py-1 text-xs font-bold border-2 border-black bg-acid/20 text-ink rounded-[0.5rem]">
                {platform}
              </span>
            ))}
          </div>

          {/* Key stats */}
          <div className="grid grid-cols-3 gap-3 mt-auto">
            <div className="text-center p-3 border-2 border-black bg-teal/10 rounded-[0.5rem]">
              <div className="font-dela text-xl sm:text-2xl font-bold text-teal mb-1">30+</div>
              <div className="text-[10px] sm:text-xs font-mono uppercase tracking-wider text-gray-600">Emails Eliminated</div>
            </div>
            <div className="text-center p-3 border-2 border-black bg-coral/10 rounded-[0.5rem]">
              <div className="font-dela text-xl sm:text-2xl font-bold text-coral mb-1">5 min</div>
              <div className="text-[10px] sm:text-xs font-mono uppercase tracking-wider text-gray-600">Setup Time</div>
            </div>
            <div className="text-center p-3 border-2 border-black bg-acid/10 rounded-[0.5rem]">
              <div className="font-dela text-xl sm:text-2xl font-bold text-acid mb-1">100%</div>
              <div className="text-[10px] sm:text-xs font-mono uppercase tracking-wider text-gray-600">Completion</div>
            </div>
          </div>
        </m.div>

        {/* 2. REAL-TIME ACTIVITY - Top Right */}
        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="p-6 sm:p-8 border-2 border-black bg-paper shadow-brutalist rounded-[0.75rem] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200 touch-feedback flex flex-col"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 border-2 border-black bg-coral flex items-center justify-center rounded-[0.5rem] flex-shrink-0">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="text-xs sm:text-sm font-bold uppercase tracking-wide text-ink">Live Activity Feed</span>
          </div>
          <h3 className="font-dela text-xl sm:text-2xl text-ink mb-3">
            Real-Time OAuth Events
          </h3>
          <p className="text-sm leading-relaxed mb-6 text-gray-700">
            Watch agencies onboard clients in minutes. Token refreshes, new connections, platform integrations — all visible instantly.
          </p>

          {/* Simple activity list */}
          <div className="space-y-2 flex-1">
            {[
              { title: "Meta Ads Authorized", time: "1m ago", icon: "📘" },
              { title: "Google Connected", time: "3m ago", icon: "🔍" },
              { title: "Token Auto-Refresh", time: "6m ago", icon: "🔄" },
            ].map((item, i) => (
              <m.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1, duration: 0.3 }}
                className="flex items-center gap-3 p-3 border-2 border-black bg-white rounded-[0.5rem] shadow-[2px_2px_0px_#000]"
              >
                <span className="text-xl">{item.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs sm:text-sm font-bold text-ink">{item.title}</div>
                  <div className="text-[10px] text-gray-600">{item.time}</div>
                </div>
              </m.div>
            ))}
          </div>
        </m.div>

        {/* 3. CHART - Bottom Left - OAuth Analytics */}
        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="p-6 sm:p-8 border-2 border-black bg-paper shadow-brutalist rounded-[0.75rem] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200 touch-feedback space-y-4 flex flex-col"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 border-2 border-black bg-teal flex items-center justify-center rounded-[0.5rem] flex-shrink-0">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wide text-ink">OAuth Analytics</span>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-mono text-gray-600 uppercase tracking-wider">Growth Rate</div>
              <div className="font-dela text-lg sm:text-xl font-bold text-teal">+127%</div>
            </div>
          </div>
          <h3 className="font-dela text-xl sm:text-2xl text-ink">
            Client Onboarding Accelerated
          </h3>
          <p className="text-sm leading-relaxed text-gray-700">
            Scale from 10 to 100 clients without adding headcount. Token health monitoring ensures 99.9% uptime.
          </p>

          {/* Simple brutalist stats - replacing complex chart */}
          <div className="grid grid-cols-2 gap-3 my-4">
            <div className="p-3 border-2 border-black bg-coral/10 rounded-[0.5rem]">
              <div className="text-[10px] font-mono text-gray-600 mb-1 uppercase tracking-wider">Active OAuth Tokens</div>
              <div className="font-dela text-2xl sm:text-3xl font-bold text-coral">400</div>
            </div>
            <div className="p-3 border-2 border-black bg-teal/10 rounded-[0.5rem]">
              <div className="text-[10px] font-mono text-gray-600 mb-1 uppercase tracking-wider">New Authorizations</div>
              <div className="font-dela text-2xl sm:text-3xl font-bold text-teal">520</div>
            </div>
          </div>
          
          {/* Bottom stats */}
          <div className="flex items-center justify-between pt-4 border-t-2 border-black mt-auto">
            <div>
              <div className="text-[10px] font-mono text-gray-600 uppercase tracking-wider">Token Health</div>
              <div className="font-dela text-sm font-bold text-ink">99.9% Uptime</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-mono text-gray-600 uppercase tracking-wider">Auto-Refreshed</div>
              <div className="font-dela text-sm font-bold text-ink">1,247 This Month</div>
            </div>
          </div>
        </m.div>

        {/* 4. SECURITY - Bottom Right */}
        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="p-6 sm:p-8 border-2 border-black bg-paper shadow-brutalist rounded-[0.75rem] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200 touch-feedback flex flex-col"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 border-2 border-black bg-acid flex items-center justify-center rounded-[0.5rem] flex-shrink-0">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-xs sm:text-sm font-bold uppercase tracking-wide text-ink">Enterprise Security</span>
          </div>
          <h3 className="font-dela text-xl sm:text-2xl text-ink mb-3">
            SOC 2 Compliant Token Storage
          </h3>
          <p className="text-sm leading-relaxed mb-4 text-gray-700">
            OAuth tokens encrypted in Infisical. Auto-refresh, complete audit logs, and zero password sharing ever.
          </p>

          {/* Key stats */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="p-3 border-2 border-black bg-teal/10 rounded-[0.5rem]">
              <div className="font-dela text-xl sm:text-2xl font-bold text-teal mb-1">SOC 2</div>
              <div className="text-[10px] sm:text-xs font-mono text-gray-600 uppercase tracking-wider">Type II Certified</div>
            </div>
            <div className="p-3 border-2 border-black bg-coral/10 rounded-[0.5rem]">
              <div className="font-dela text-xl sm:text-2xl font-bold text-coral mb-1">99.9%</div>
              <div className="text-[10px] sm:text-xs font-mono text-gray-600 uppercase tracking-wider">Token Uptime</div>
            </div>
          </div>

          {/* Benefits list */}
          <ul className="space-y-2 mt-2">
            {[
              "Automatic token refresh before expiration",
              "Complete audit logging & compliance",
              "Never share passwords with clients",
              "Bank-grade encryption at rest"
            ].map((benefit, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="w-5 h-5 border-2 border-black bg-teal flex items-center justify-center rounded-[0.25rem] flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">✓</span>
                </span>
                <span className="text-sm font-medium text-ink">{benefit}</span>
              </li>
            ))}
          </ul>
        </m.div>
        </div>
      </div>
    </section>
  )
}