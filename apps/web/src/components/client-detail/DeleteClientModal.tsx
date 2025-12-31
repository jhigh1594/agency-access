'use client';

/**
 * DeleteClientModal Component
 *
 * Confirmation modal for deleting a client.
 * Shows warning message and requires explicit confirmation.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@clerk/nextjs';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

interface DeleteClientModalProps {
  client: {
    id: string;
    name: string;
    company: string;
    email: string;
  };
  onClose: () => void;
}

export function DeleteClientModal({ client, onClose }: DeleteClientModalProps) {
  const { orgId } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [confirmation, setConfirmation] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Delete client mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/${client.id}`, {
        method: 'DELETE',
        headers: {
          'x-agency-id': orgId || '',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to delete client');
      }

      // Delete returns 204 with no body
      return null;
    },
    onSuccess: () => {
      // Invalidate and refetch queries
      queryClient.invalidateQueries({ queryKey: ['clients-with-connections'] });

      setSuccess(true);
      setTimeout(() => {
        onClose();
        // Navigate back to clients list
        router.push('/clients');
      }, 1000);
    },
    onError: (error: Error) => {
      setErrorMessage(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Verify confirmation matches client email
    if (confirmation !== client.email) {
      setErrorMessage('Please enter the correct email address to confirm');
      return;
    }

    // Delete client
    deleteMutation.mutate();
  };

  const canDelete = confirmation === client.email;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-lg shadow-xl max-w-md w-full"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Delete Client</h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-slate-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Warning icon */}
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Delete {client.name}?
                </h3>
                <p className="text-sm text-slate-600">
                  from {client.company}
                </p>
              </div>
            </div>

            {/* Warning message */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-800">
                <strong>Warning:</strong> This action cannot be undone. All access requests and
                connections associated with this client will be permanently deleted.
              </p>
            </div>

            {/* Confirmation input */}
            {!success && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Type the client email to confirm
                  </label>
                  <input
                    type="text"
                    value={confirmation}
                    onChange={(e) => setConfirmation(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder={client.email}
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Enter <strong>{client.email}</strong> to confirm deletion
                  </p>
                </div>

                {/* Error message */}
                {errorMessage && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{errorMessage}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={deleteMutation.isPending}
                    className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!canDelete || deleteMutation.isPending}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {deleteMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      'Delete Client'
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Success message */}
            {success && (
              <div className="text-center py-4">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                  <p className="text-lg font-semibold text-slate-900">Client Deleted</p>
                </div>
                <p className="text-sm text-slate-600">
                  Redirecting to clients list...
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
