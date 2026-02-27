'use client';

import { Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui';

export type InviteLoadState = 'loading' | 'delayed' | 'timeout' | 'error';

interface InviteLoadStateCardProps {
  phase: InviteLoadState;
  message: string;
  onRetry: () => void;
  supportHref?: string;
}

export function InviteLoadStateCard({
  phase,
  message,
  onRetry,
  supportHref = '/help',
}: InviteLoadStateCardProps) {
  if (phase === 'loading' || phase === 'delayed') {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <div className="text-center max-w-sm px-4">
          <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-coral" />
          <p className="text-sm text-muted-foreground">
            {phase === 'loading'
              ? 'Loading your authorization request...'
              : 'Still loading... this may take a few more seconds.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-lg border-2 border-black bg-card p-8 shadow-brutalist text-center">
        <h1 className="text-2xl font-semibold text-ink font-display">
          {phase === 'timeout' ? 'Still working on it' : 'Request link unavailable'}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">{message}</p>
        <div className="mt-6 flex flex-col gap-3">
          <Button variant="primary" onClick={onRetry} leftIcon={<RefreshCw className="h-4 w-4" />}>
            Retry
          </Button>
          <a href={supportHref} className="text-sm font-medium text-coral hover:text-coral/90">
            Contact support
          </a>
        </div>
      </div>
    </div>
  );
}
