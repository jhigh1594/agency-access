import type { ReactNode } from 'react';
import { m } from 'framer-motion';

interface InvitePlatformStageProps {
  platformName: string;
  description: string;
  remainingCount: number;
  completedCount: number;
  totalCount: number;
  nextPlatformName?: string | null;
  children: ReactNode;
}

export function InvitePlatformStage({
  platformName,
  description,
  remainingCount,
  completedCount,
  totalCount,
  nextPlatformName,
  children,
}: InvitePlatformStageProps) {
  return (
    <m.section
      layout
      initial={false}
      transition={{ type: 'spring', stiffness: 260, damping: 24 }}
      className="flex flex-col gap-2 sm:gap-3"
      aria-label={`Active platform: ${platformName}`}
    >
      <m.div
        layout
        initial={false}
        transition={{ type: 'spring', stiffness: 260, damping: 24 }}
        className="order-1 sm:order-2"
      >
        {children}
      </m.div>

      <div className="order-2 rounded-[1.5rem] border border-border bg-card px-4 py-3 shadow-sm sm:order-1 sm:px-5 sm:py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Now connecting
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold text-ink font-display sm:text-2xl">{platformName}</h2>
              <div className="rounded-full border border-border bg-paper px-3 py-1 text-xs font-semibold text-ink">
                {completedCount} of {totalCount} complete
              </div>
            </div>
            <p className="mt-1.5 max-w-2xl text-sm leading-5 text-muted-foreground sm:mt-2 sm:leading-6">
              {description}
            </p>
          </div>

          <div className="hidden flex-wrap gap-2 sm:flex">
            {nextPlatformName ? (
              <>
                <div className="rounded-full border border-border bg-paper px-3 py-1 text-xs font-semibold text-ink">
                  Now: {platformName}
                </div>
                <div className="rounded-full border border-border bg-paper px-3 py-1 text-xs font-semibold text-muted-foreground">
                  Then: {nextPlatformName}
                </div>
              </>
            ) : (
              <div className="rounded-full border border-teal/40 bg-teal/10 px-3 py-1 text-xs font-semibold text-teal">
                Final authorization step
              </div>
            )}
          </div>
        </div>
      </div>
    </m.section>
  );
}
