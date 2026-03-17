'use client';

import { ReactNode } from 'react';
import { m } from 'framer-motion';

interface InviteFlowShellProps {
  title: string;
  description?: string;
  header?: ReactNode;
  step?: number;
  totalSteps?: number;
  steps?: string[];
  rightSlot?: ReactNode;
  rail?: ReactNode;
  layoutMode?: 'focused' | 'split';
  showProgress?: boolean;
  mobileRailLabel?: string;
  density?: 'default' | 'compact';
  hideStepChipsOnMobile?: boolean;
  children: ReactNode;
}

export function InviteFlowShell({
  title,
  description,
  header,
  step = 1,
  totalSteps = 3,
  steps = ['Setup', 'Connect', 'Done'],
  rightSlot,
  rail,
  layoutMode = 'focused',
  showProgress = true,
  mobileRailLabel = 'Request details and support',
  density = 'default',
  hideStepChipsOnMobile = false,
  children,
}: InviteFlowShellProps) {
  const safeStep = Math.max(1, Math.min(step, Math.max(1, totalSteps)));
  const progress = Math.round((safeStep / Math.max(1, totalSteps)) * 100);
  const isSplit = layoutMode === 'split';
  const isCompact = density === 'compact';

  return (
    <div className="min-h-screen bg-paper">
      <div
        className={`mx-auto px-4 ${isCompact ? 'py-6 sm:px-6 lg:px-8' : 'py-8 sm:px-6 lg:px-8'} ${isSplit ? 'max-w-7xl' : 'max-w-5xl'}`}
      >
        <header className={`${isCompact ? 'mb-6 space-y-3' : 'mb-8 space-y-4'}`}>
          {header ? (
            header
          ) : (
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl font-semibold text-ink font-display">{title}</h1>
                {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
              </div>
              {rightSlot}
            </div>
          )}

          {showProgress ? (
            <div className={isCompact ? 'space-y-2' : 'space-y-3'}>
              <div className="h-2 overflow-hidden rounded-lg bg-muted/30" aria-hidden="true">
                <m.div
                  className="h-full bg-coral"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                />
              </div>

              <div className="flex items-center justify-between text-xs font-medium tracking-wide text-muted-foreground">
                <span>
                  Step {safeStep} of {totalSteps}
                </span>
                <span>{progress}% complete</span>
              </div>

              {steps.length > 0 ? (
                <div
                  data-hide-on-mobile={hideStepChipsOnMobile ? 'true' : 'false'}
                  className={[
                    `grid gap-2 ${steps.length <= 3 ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-4'}`,
                    hideStepChipsOnMobile ? 'hidden sm:grid' : '',
                  ].join(' ')}
                >
                  {steps.map((label, index) => {
                    const stepNumber = index + 1;
                    const isActive = stepNumber === safeStep;
                    const isComplete = stepNumber < safeStep;

                    return (
                      <div
                        key={label}
                        className={[
                          `rounded-lg border ${isCompact ? 'px-3 py-1.5 text-[11px]' : 'px-3 py-2 text-xs'} font-semibold uppercase tracking-wide`,
                          isActive
                            ? 'border-coral bg-coral/10 text-coral'
                            : isComplete
                            ? 'border-teal bg-teal/10 text-teal-90'
                            : 'border-border bg-card text-muted-foreground',
                        ].join(' ')}
                      >
                        {stepNumber} · {label}
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>
          ) : null}
        </header>

        {isSplit ? (
          <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)] lg:items-start">
            <div className="order-1 min-w-0 lg:order-2">{children}</div>
            {rail ? (
              <div className="order-2 lg:hidden">
                <details className="overflow-hidden rounded-2xl border border-border bg-card">
                  <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-ink">
                    {mobileRailLabel}
                  </summary>
                  <div className="border-t border-border px-4 py-4">{rail}</div>
                </details>
              </div>
            ) : null}
            <aside className="order-1 hidden lg:block">{rail}</aside>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
