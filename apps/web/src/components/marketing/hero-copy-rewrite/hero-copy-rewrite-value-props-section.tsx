'use client';

import { Activity, Globe, Shield, Zap } from 'lucide-react';
import { m } from 'framer-motion';

const valueProps = [
  {
    eyebrow: 'All platforms. One send.',
    title: 'One request for the core platforms you need at kickoff',
    body:
      'Build a single onboarding request for Meta Ads, Google Ads, GA4, LinkedIn, and related platforms instead of assembling a separate process for each one.',
    detail:
      'Start paid media and reporting without waiting on a fourth follow-up email.',
    icon: Globe,
    tone: 'bg-teal',
  },
  {
    eyebrow: 'No more inbox archaeology',
    title: 'One place to track access after the client says yes',
    body:
      'Keep requests, tokens, and onboarding status in a dedicated workflow instead of relying on a buried inbox thread as the source of truth.',
    detail:
      "Your team sees who has connected, who hasn't, and what's still pending — without checking inboxes.",
    icon: Activity,
    tone: 'bg-coral',
  },
  {
    eyebrow: 'Clients who actually complete it',
    title: 'A guided client handoff and a faster kickoff for your team',
    body:
      'Use a guided, branded client flow so the access step feels intentional and repeatable instead of improvised in email.',
    detail:
      'Clients complete the guided flow without calling you to ask which settings panel to click.',
    icon: Zap,
    tone: 'bg-acid',
  },
  {
    eyebrow: 'No password sharing, ever',
    title: 'OAuth-based access management instead of password sharing',
    body:
      'Keep access requests, audit history, and token refresh behavior inside the product so the handoff stays organized after onboarding too.',
    detail:
      'Clients authorize via OAuth so you never ask for — or store — anyone\'s login credentials.',
    icon: Shield,
    tone: 'bg-ink',
  },
];

export function HeroCopyRewriteValuePropsSection() {
  return (
    <section
      id="trusted-by-agencies"
      className="py-16 sm:py-20 md:py-24 border-y-2 border-black bg-paper relative overflow-hidden"
    >
      <div className="absolute inset-0 opacity-20 pointer-events-none -z-10 diagonal-lines" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 border-2 border-black bg-coral text-paper px-4 sm:px-6 py-2 text-[10px] sm:text-xs font-bold uppercase tracking-widest font-mono shadow-brutalist rounded-[0.75rem] mb-6">
            <Zap size={14} />
            Value propositions
          </div>
          <h2 className="font-dela text-3xl sm:text-4xl md:text-5xl tracking-tight text-ink mb-4">
            What changes when the access step stops living in your inbox
          </h2>
          <p className="font-mono text-base sm:text-lg text-gray-600 max-w-3xl mx-auto">
            The access step is already part of every onboarding. These four things
            change when you run it through AuthHub instead of email.
          </p>
        </m.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
          {valueProps.map((item, index) => (
            <m.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 * (index + 1) }}
              className="p-6 sm:p-8 border-2 border-black bg-paper shadow-brutalist rounded-[0.75rem] transition-all duration-200 touch-feedback flex flex-col"
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={`w-10 h-10 border-2 border-black ${item.tone} flex items-center justify-center rounded-[0.5rem] flex-shrink-0`}
                >
                  <item.icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs sm:text-sm font-bold uppercase tracking-wide text-ink">
                  {item.eyebrow}
                </span>
              </div>
              <h3 className="font-dela text-xl sm:text-2xl text-ink mb-3">
                {item.title}
              </h3>
              <p className="text-sm leading-relaxed mb-6 text-gray-700">
                {item.body}
              </p>
              <div className="mt-auto border-t-2 border-black pt-4 font-mono text-xs leading-relaxed text-gray-600">
                {item.detail}
              </div>
            </m.div>
          ))}
        </div>
      </div>
    </section>
  );
}
