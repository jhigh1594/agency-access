'use client';

import type { ReactNode } from 'react';

interface InviteHeroHeaderStat {
  label: string;
  value: string;
}

interface InviteHeroHeaderProps {
  eyebrow?: string;
  title: string;
  description: string;
  badge?: string;
  logoUrl?: string;
  logoAlt?: string;
  fallbackMark?: string;
  stats?: InviteHeroHeaderStat[];
  aside?: ReactNode;
}

export function InviteHeroHeader({
  eyebrow,
  title,
  description,
  badge,
  logoUrl,
  logoAlt,
  fallbackMark,
  stats = [],
  aside,
}: InviteHeroHeaderProps) {
  const resolvedFallbackMark = fallbackMark || title.slice(0, 1).toUpperCase();

  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-border bg-card shadow-sm">
      <div className="border-b border-border bg-gradient-to-r from-paper via-paper to-muted/20 px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl border border-border bg-paper">
                {logoUrl ? (
                  <img src={logoUrl} alt={logoAlt || title} className="h-full w-full object-contain p-2" />
                ) : (
                  <span className="text-sm font-semibold text-ink">{resolvedFallbackMark}</span>
                )}
              </div>
              {eyebrow ? (
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{eyebrow}</p>
              ) : null}
              {badge ? (
                <span className="inline-flex min-h-[32px] items-center rounded-full border border-border bg-paper px-3 text-xs font-semibold text-ink">
                  {badge}
                </span>
              ) : null}
            </div>

            <div className="space-y-2">
              <h1 className="max-w-3xl text-3xl font-semibold text-ink font-display sm:text-4xl">{title}</h1>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">{description}</p>
            </div>
          </div>

          {aside ? <div className="shrink-0">{aside}</div> : null}
        </div>
      </div>

      {stats.length > 0 ? (
        <div className="grid gap-px bg-border sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <div key={`${stat.label}:${stat.value}`} className="bg-card px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{stat.label}</p>
              <p className="mt-2 text-sm font-medium text-ink">{stat.value}</p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export type { InviteHeroHeaderProps, InviteHeroHeaderStat };
