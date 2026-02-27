'use client';

import { ReactNode } from 'react';
import { m } from 'framer-motion';

interface FlowShellProps {
  title: string;
  description?: string;
  step: number;
  totalSteps: number;
  steps?: string[];
  children: ReactNode;
  rightSlot?: ReactNode;
}

export function FlowShell({
  title,
  description,
  step,
  totalSteps,
  steps,
  children,
  rightSlot,
}: FlowShellProps) {
  const safeStep = Math.max(1, Math.min(step, totalSteps));
  const progress = Math.round((safeStep / totalSteps) * 100);

  return (
    <div className="min-h-screen bg-paper">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold text-ink font-display">{title}</h1>
              {description ? (
                <p className="mt-1 text-sm text-muted-foreground">{description}</p>
              ) : null}
            </div>
            {rightSlot}
          </div>

          <div className="space-y-3">
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

            {steps && steps.length > 0 ? (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {steps.map((label, index) => {
                  const stepNumber = index + 1;
                  const isActive = stepNumber === safeStep;
                  const isComplete = stepNumber < safeStep;

                  return (
                    <div
                      key={label}
                      className={[
                        'rounded-lg border px-3 py-2 text-xs font-semibold uppercase tracking-wide',
                        isActive
                          ? 'border-coral bg-coral/10 text-coral'
                          : isComplete
                          ? 'border-teal bg-teal/10 text-teal-90'
                          : 'border-border bg-card text-muted-foreground',
                      ].join(' ')}
                    >
                      {label}
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>
        </header>

        {children}
      </div>
    </div>
  );
}
