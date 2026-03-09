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
      className="space-y-4"
      aria-label={`Active platform: ${platformName}`}
    >
      <div className="overflow-hidden rounded-[1.75rem] border border-border bg-card shadow-sm">
        <div className="h-1.5 bg-coral/80" aria-hidden="true" />

        <div className="px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Now connecting
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-ink font-display">{platformName}</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
            </div>

            <div className="rounded-2xl border border-border bg-paper px-4 py-3 text-right text-sm text-muted-foreground">
              <p className="font-semibold text-ink">
                {remainingCount === 0
                  ? 'Last platform in this request'
                  : `${remainingCount} more platform${remainingCount === 1 ? '' : 's'} after this`}
              </p>
              <p className="mt-1 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                {completedCount} of {totalCount} complete
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <div className="rounded-full border border-border bg-paper px-3 py-1 text-xs font-semibold text-ink">
              Now: {platformName}
            </div>
            {nextPlatformName ? (
              <div className="rounded-full border border-border bg-paper px-3 py-1 text-xs font-semibold text-muted-foreground">
                Then: {nextPlatformName}
              </div>
            ) : (
              <div className="rounded-full border border-teal/40 bg-teal/10 px-3 py-1 text-xs font-semibold text-teal">
                Final authorization step
              </div>
            )}
          </div>
        </div>
      </div>

      <m.div
        layout
        initial={false}
        transition={{ type: 'spring', stiffness: 260, damping: 24 }}
      >
        {children}
      </m.div>
    </m.section>
  );
}
