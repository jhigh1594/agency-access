import { Check } from 'lucide-react';
import { m } from 'framer-motion';
import { PlatformIcon } from '@/components/ui';
import type { Platform } from '@agency-platform/shared';

interface InvitePlatformQueueItemProps {
  platform: Platform;
  platformName: string;
  description: string;
  status: 'completed' | 'up-next';
  sequenceLabel?: string;
}

export function InvitePlatformQueueItem({
  platform,
  platformName,
  description,
  status,
  sequenceLabel,
}: InvitePlatformQueueItemProps) {
  const isCompleted = status === 'completed';

  return (
    <m.div
      layout
      initial={false}
      transition={{ type: 'spring', stiffness: 280, damping: 26 }}
      className={
        isCompleted
          ? 'rounded-2xl border border-teal/40 bg-teal/10 px-5 py-4'
          : 'rounded-2xl border border-border bg-paper px-5 py-4 transition-colors hover:bg-card'
      }
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-border bg-card">
            <PlatformIcon platform={platform} size="md" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {isCompleted ? 'Completed' : 'Up next'}
            </p>
            <p className="mt-1 text-base font-semibold text-ink">{platformName}</p>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          </div>
        </div>

        {isCompleted ? (
          <Check className="h-5 w-5 shrink-0 text-teal" />
        ) : (
          <div className="rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-ink">
            {sequenceLabel || 'Queue'}
          </div>
        )}
      </div>
    </m.div>
  );
}
