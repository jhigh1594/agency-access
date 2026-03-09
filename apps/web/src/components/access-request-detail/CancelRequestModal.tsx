'use client';

/**
 * CancelRequestModal Component
 *
 * Confirmation modal for revoking a pending access request.
 * The authorization link will stop working; the request remains in the list with revoked status.
 */

import { m, AnimatePresence } from 'framer-motion';
import { X, Loader2, Unlink } from 'lucide-react';
import { Button } from '@/components/ui';

interface CancelRequestModalProps {
  requestName: string;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
  isPending?: boolean;
}

export function CancelRequestModal({
  requestName,
  onConfirm,
  onClose,
  isPending = false,
}: CancelRequestModalProps) {
  const handleConfirm = async () => {
    await onConfirm();
    onClose();
  };

  return (
    <AnimatePresence>
      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
        onClick={onClose}
      >
        <m.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-card rounded-lg shadow-brutalist max-w-md w-full border border-black/10"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-black/10">
            <h2 className="text-lg font-semibold text-ink font-display">Cancel Request</h2>
            <Button
              onClick={onClose}
              variant="ghost"
              size="icon"
              aria-label="Close modal"
              disabled={isPending}
            >
              <X className="h-5 w-5 text-muted-foreground" />
            </Button>
          </div>

          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-coral/20 rounded-lg">
                <Unlink className="h-5 w-5 text-coral" />
              </div>
              <h3 className="text-lg font-semibold text-ink">Revoke this access request?</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              The authorization link will stop working. The client will no longer be able to use it.
              {requestName && (
                <>
                  {' '}
                  <strong className="text-foreground">{requestName}</strong> will appear as revoked
                  in your list.
                </>
              )}
            </p>
            <div className="flex justify-end gap-3 border-t border-black/10 pt-4">
              <Button
                type="button"
                onClick={onClose}
                disabled={isPending}
                variant="secondary"
                size="sm"
              >
                Keep Request
              </Button>
              <Button
                type="button"
                onClick={handleConfirm}
                disabled={isPending}
                variant="danger"
                size="sm"
                leftIcon={isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined}
              >
                {isPending ? 'Cancelling...' : 'Cancel Request'}
              </Button>
            </div>
          </div>
        </m.div>
      </m.div>
    </AnimatePresence>
  );
}
