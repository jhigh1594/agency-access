'use client';

import { Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InviteTrustNoteProps {
  title?: string;
  description: string;
  className?: string;
}

export function InviteTrustNote({
  title = 'You stay in control',
  description,
  className,
}: InviteTrustNoteProps) {
  return (
    <div className={cn('rounded-2xl border border-border bg-paper/80 p-4', className)}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground">
          <Lock className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-semibold text-ink">{title}</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
      </div>
    </div>
  );
}

export type { InviteTrustNoteProps };
