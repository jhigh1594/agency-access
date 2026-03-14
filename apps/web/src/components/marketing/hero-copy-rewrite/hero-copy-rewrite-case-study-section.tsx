'use client';

import { Clock, TrendingUp, Users } from 'lucide-react';

const caseStudyMetrics = [
  {
    label: 'Active Client Projects',
    before: '12',
    after: '38',
    icon: Users,
  },
  {
    label: 'Platform Connection Time',
    before: '2-3 days',
    after: '< 5 min',
    icon: Clock,
  },
  {
    label: 'Automation Setup Speed',
    before: '1 week',
    after: 'Same day',
    icon: TrendingUp,
  },
];

export function HeroCopyRewriteCaseStudySection() {
  return (
    <section className="border-b-2 border-black bg-card">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="max-w-3xl">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-gray-600">
            Case study
          </p>
          <h2 className="mt-4 font-dela text-3xl sm:text-4xl lg:text-5xl tracking-tight leading-[1.08] text-ink">
            From 12 to 38 active clients. Same team. The access step stopped blocking them.
          </h2>
          <p className="mt-5 max-w-2xl font-mono text-base sm:text-lg leading-relaxed text-gray-700">
            Pillar AI builds automation workflows for clients. Before AuthHub,
            every new engagement started with days of platform access back-and-forth.
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <div className="rounded-[1rem] border-2 border-black bg-ink p-8 text-paper shadow-brutalist-xl">
            <div className="inline-flex rounded-[0.75rem] border-2 border-white/20 bg-white/10 px-3 py-2 font-mono text-xs font-bold uppercase tracking-wide">
              Pillar AI Agency
            </div>
            <blockquote className="mt-6 font-display text-xl sm:text-2xl italic leading-tight text-paper">
              “We were spending days just trying to get access to client accounts
              before we could even start building automations. AuthHub changed
              everything. Now our clients connect their platforms in 5 minutes,
              and we can start building workflows the same day instead of waiting
              a week.”
            </blockquote>
            <div className="mt-6 border-t border-white/20 pt-6">
              <p className="font-black text-base text-paper">AJ S.</p>
              <p className="mt-1 font-mono text-xs uppercase tracking-[0.2em] text-paper/70">
                Co-Founder, Pillar AI — AI automation agency
              </p>
            </div>
          </div>

          <div className="grid gap-4">
            {caseStudyMetrics.map((metric) => (
              <div
                key={metric.label}
                className="rounded-[1rem] border-2 border-black bg-paper p-5 shadow-brutalist"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="inline-flex rounded-[0.75rem] border-2 border-black bg-teal/15 p-3">
                      <metric.icon size={20} className="text-teal" />
                    </div>
                    <div>
                      <p className="font-black uppercase tracking-wide text-ink">
                        {metric.label}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm text-gray-400 line-through">
                      {metric.before}
                    </span>
                    <span className="font-dela text-xl text-coral">→</span>
                    <span className="font-dela text-lg text-ink">{metric.after}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
