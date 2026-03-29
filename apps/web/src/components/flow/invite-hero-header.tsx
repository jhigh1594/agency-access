'use client';

import Image from 'next/image';
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
  density?: 'default' | 'compact';
  statsLayout?: 'grid' | 'inline';
  hideInlineStatsOnMobile?: boolean;
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
  density = 'default',
  statsLayout = 'grid',
  hideInlineStatsOnMobile = false,
}: InviteHeroHeaderProps) {
  const resolvedFallbackMark = fallbackMark || title.slice(0, 1).toUpperCase();
  const isCompact = density === 'compact';
  const useInlineStats = statsLayout === 'inline';

  return (
    <div
      data-density={density}
      className="overflow-hidden rounded-[1.75rem] border border-border bg-card shadow-sm"
    >
      <div
        className={[
          'bg-gradient-to-r from-paper via-paper to-muted/20',
          isCompact ? 'px-5 py-4 sm:px-6' : 'border-b border-border px-5 py-5 sm:px-6',
        ].join(' ')}
      >
        <div className={`flex flex-col ${isCompact ? 'gap-4 lg:gap-5' : 'gap-5'} lg:flex-row lg:items-start lg:justify-between`}>
          <div className={`min-w-0 ${isCompact ? 'space-y-3' : 'space-y-4'}`}>
            <div className="flex flex-wrap items-center gap-3">
              <div
                className={[
                  'relative flex items-center justify-center overflow-hidden rounded-2xl border border-border bg-paper',
                  isCompact ? 'h-10 w-10' : 'h-11 w-11',
                ].join(' ')}
              >
                {logoUrl ? (
                  <Image
                    src={logoUrl}
                    alt={logoAlt || title}
                    fill
                    className="object-contain p-2"
                    sizes={isCompact ? '40px' : '44px'}
                    unoptimized
                    priority
                  />
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

            <div className={isCompact ? 'space-y-1' : 'space-y-2'}>
              <h1
                className={[
                  'max-w-3xl font-semibold text-ink font-display',
                  isCompact ? 'text-[2rem] leading-[1.02] sm:text-[2.7rem]' : 'text-3xl sm:text-4xl',
                ].join(' ')}
              >
                {title}
              </h1>
              <p className="max-w-2xl text-sm leading-5 text-muted-foreground sm:text-[15px]">{description}</p>
            </div>

            {stats.length > 0 && useInlineStats ? (
              <div
                data-stats-layout="inline"
                data-hide-on-mobile={hideInlineStatsOnMobile ? 'true' : 'false'}
                className={[
                  'flex flex-wrap gap-2 pt-0.5',
                  hideInlineStatsOnMobile ? 'hidden sm:flex' : '',
                ].join(' ')}
              >
                {stats.map((stat) => (
                  <div
                    key={`${stat.label}:${stat.value}`}
                    className="rounded-full border border-border bg-paper px-3 py-1.5"
                  >
                    <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      {stat.label}
                    </span>
                    <span className="ml-2 text-sm font-medium text-ink">{stat.value}</span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          {aside ? <div className="shrink-0">{aside}</div> : null}
        </div>
      </div>

      {stats.length > 0 && !useInlineStats ? (
        <div data-stats-layout="grid" className="grid gap-px bg-border sm:grid-cols-2 xl:grid-cols-4">
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
