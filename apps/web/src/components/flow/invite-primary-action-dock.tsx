'use client';

import { Button } from '@/components/ui';

interface InvitePrimaryActionDockProps {
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
}

export function InvitePrimaryActionDock({
  title,
  description,
  actionLabel,
  onAction,
}: InvitePrimaryActionDockProps) {
  return (
    <div className="fixed inset-x-4 bottom-4 z-30 sm:inset-x-6 lg:left-auto lg:right-8 lg:w-[420px]">
      <div className="rounded-[1.5rem] border border-border bg-card/95 p-3 shadow-lg backdrop-blur">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink">{title}</p>
            <p className="mt-1 text-sm leading-5 text-muted-foreground">{description}</p>
          </div>
          <Button type="button" variant="primary" onClick={onAction} className="shrink-0">
            {actionLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

export type { InvitePrimaryActionDockProps };
