import type { Metadata } from 'next';
import Link from 'next/link';
import type { Route } from 'next';
import { ShieldCheck, Sparkles, TimerReset } from 'lucide-react';

import { Reveal } from '@/components/marketing/reveal';

export const metadata: Metadata = {
  title: 'About | AuthHub',
  description:
    'AuthHub helps agencies replace client access chaos with secure OAuth onboarding, clean audit trails, and one-link client requests.',
  alternates: {
    canonical: 'https://authhub.co/about',
  },
  openGraph: {
    title: 'About | AuthHub',
    description:
      'Meet AuthHub, the client access management platform built for agencies that need secure, fast onboarding.',
    type: 'website',
    url: 'https://authhub.co/about',
  },
};

const principles = [
  {
    title: 'Make access feel calm',
    body: 'Clients should not need a platform admin manual to approve an agency request. AuthHub turns fragmented OAuth and permission flows into one guided handoff.',
    icon: Sparkles,
  },
  {
    title: 'Treat tokens like secrets',
    body: 'Client platform tokens deserve real secrets management, access logging, and lifecycle controls instead of spreadsheets, inboxes, or ordinary database rows.',
    icon: ShieldCheck,
  },
  {
    title: 'Give operators their time back',
    body: 'Every avoidable follow-up is time an account team cannot spend on strategy. We build for the teams that onboard clients every week.',
    icon: TimerReset,
  },
];

export default function AboutPage() {
  return (
    <main className="relative bg-paper">
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <Reveal direction="up">
                <span className="mb-6 inline-block rounded-full bg-teal/10 px-4 py-1.5 font-mono text-sm font-bold text-teal">
                  Built for agency onboarding teams
                </span>
              </Reveal>
              <Reveal direction="up" delay={0.1}>
                <h1 className="font-dela text-4xl font-black leading-tight text-ink sm:text-5xl lg:text-6xl">
                  Client access should not slow down good work.
                </h1>
              </Reveal>
              <Reveal direction="up" delay={0.2}>
                <p className="mt-6 max-w-2xl text-lg leading-8 text-gray-600 sm:text-xl">
                  AuthHub exists for the messy moment after a deal closes: the agency is ready,
                  the client is busy, and five different platforms all need the right level of
                  access before work can begin.
                </p>
              </Reveal>
              <Reveal direction="up" delay={0.3}>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href={'/pricing' as Route}
                    className="inline-flex items-center justify-center border-2 border-black bg-coral px-6 py-3 font-mono text-sm font-black uppercase tracking-wider text-white shadow-[4px_4px_0px_#000] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#000]"
                  >
                    See pricing
                  </Link>
                  <Link
                    href={'/contact' as Route}
                    className="inline-flex items-center justify-center border-2 border-black bg-paper px-6 py-3 font-mono text-sm font-black uppercase tracking-wider text-ink shadow-[4px_4px_0px_#000] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#000]"
                  >
                    Talk to us
                  </Link>
                </div>
              </Reveal>
            </div>

            <Reveal direction="up" delay={0.2}>
              <div className="border-2 border-black bg-card p-6 shadow-brutalist">
                <dl className="grid gap-6 sm:grid-cols-3 lg:grid-cols-1">
                  <div>
                    <dt className="font-mono text-xs font-black uppercase tracking-widest text-gray-500">
                      Focus
                    </dt>
                    <dd className="mt-2 font-display text-2xl font-black text-ink">
                      Client access management
                    </dd>
                  </div>
                  <div>
                    <dt className="font-mono text-xs font-black uppercase tracking-widest text-gray-500">
                      Built for
                    </dt>
                    <dd className="mt-2 font-display text-2xl font-black text-ink">
                      Agencies and operators
                    </dd>
                  </div>
                  <div>
                    <dt className="font-mono text-xs font-black uppercase tracking-widest text-gray-500">
                      Standard
                    </dt>
                    <dd className="mt-2 font-display text-2xl font-black text-ink">
                      Secure by default
                    </dd>
                  </div>
                </dl>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="border-y-2 border-black bg-warm-mesh px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <Reveal direction="up">
            <h2 className="font-display text-3xl font-black text-ink sm:text-4xl">
              What we believe
            </h2>
          </Reveal>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {principles.map((principle, index) => {
              const Icon = principle.icon;
              return (
                <Reveal key={principle.title} direction="up" delay={index * 0.1}>
                  <article className="h-full border-2 border-black bg-paper p-6 shadow-[4px_4px_0px_#000]">
                    <Icon className="h-8 w-8 text-coral" aria-hidden="true" />
                    <h3 className="mt-5 font-display text-xl font-black text-ink">
                      {principle.title}
                    </h3>
                    <p className="mt-3 font-mono text-sm leading-7 text-gray-600">
                      {principle.body}
                    </p>
                  </article>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <Reveal direction="up">
            <h2 className="font-display text-3xl font-black text-ink sm:text-4xl">
              From contract signed to access granted.
            </h2>
          </Reveal>
          <Reveal direction="up" delay={0.1}>
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-gray-600">
              The product is intentionally narrow: one branded link, the right platform
              permissions, and a reliable record of who approved what. That is the part
              agencies should never have to improvise again.
            </p>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
