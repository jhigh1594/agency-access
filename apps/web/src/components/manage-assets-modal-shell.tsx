'use client';

import { AnimatePresence, m } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface ManageAssetsModalShellProps {
  isOpen: boolean;
  title: string;
  description: string;
  onClose: () => void;
  summary?: React.ReactNode;
  children: React.ReactNode;
}

export function ManageAssetsModalShell({
  isOpen,
  title,
  description,
  onClose,
  summary,
  children,
}: ManageAssetsModalShellProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
        <m.button
          type="button"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-ink/50 backdrop-blur-sm"
          aria-label="Close manage assets modal"
        />

        <m.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', duration: 0.28 }}
          onClick={(event) => event.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-label={title}
          className="relative flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-[1.25rem] border-2 border-black bg-card shadow-brutalist-lg sm:max-h-[90vh]"
        >
          <div className="border-b-2 border-black bg-paper px-5 py-4 sm:px-6">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="font-mono text-[11px] font-bold uppercase tracking-[0.24em] text-muted-foreground">
                  Manage Assets
                </p>
                <h2 className="font-display text-2xl font-semibold text-ink">{title}</h2>
                <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>
              </div>
              <Button
                type="button"
                variant="brutalist-rounded"
                size="sm"
                onClick={onClose}
                className="shrink-0"
              >
                Done
              </Button>
            </div>
            {summary ? (
              <div className="mt-4 border-t border-border pt-4">
                <div className="grid gap-3 sm:grid-cols-3">{summary}</div>
              </div>
            ) : null}
          </div>

          <div className="flex-1 overflow-y-auto bg-card px-5 py-5 sm:px-6">{children}</div>
        </m.div>
      </div>
    </AnimatePresence>
  );
}
