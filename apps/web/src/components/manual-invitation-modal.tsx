/**
 * ManualInvitationModal Component
 *
 * Modal for connecting agency platforms that use team invitation flow
 * instead of OAuth. Agencies provide the email address that will receive
 * team invitations from clients.
 *
 * Used for: Kit, Mailchimp, Beehiiv, Klaviyo
 */

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Mail, Info } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';

// Platform display names
const PLATFORM_NAMES: Record<string, string> = {
  kit: 'Kit',
  mailchimp: 'Mailchimp',
  beehiiv: 'Beehiiv',
  klaviyo: 'Klaviyo',
};

interface ManualInvitationModalProps {
  isOpen: boolean;
  onClose: () => void;
  platform: string; // 'kit' | 'mailchimp' | 'beehiiv' | 'klaviyo'
  agencyId: string;
  onSuccess?: () => void;
  mode?: 'create' | 'edit'; // 'create' for new connection, 'edit' to update email
  currentEmail?: string; // Pre-filled email for edit mode
}

export function ManualInvitationModal({
  isOpen,
  onClose,
  platform,
  agencyId,
  onSuccess,
  mode = 'create',
  currentEmail = '',
}: ManualInvitationModalProps) {
  const [email, setEmail] = useState(currentEmail || '');
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal opens
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setEmail('');
      setError(null);
    }
  };

  // Update email when currentEmail prop changes (for edit mode)
  useEffect(() => {
    if (mode === 'edit' && currentEmail) {
      setEmail(currentEmail);
    }
  }, [mode, currentEmail]);

  // Connect mutation
  const { mutate: connectPlatform, isPending } = useMutation({
    mutationFn: async (emailAddress: string) => {
      const endpoint = mode === 'edit'
        ? `${process.env.NEXT_PUBLIC_API_URL}/agency-platforms/${platform}/manual-invitation`
        : `${process.env.NEXT_PUBLIC_API_URL}/agency-platforms/${platform}/manual-connect`;

      const method = mode === 'edit' ? 'PATCH' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agencyId,
          invitationEmail: emailAddress,
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error?.message || `Failed to ${mode === 'edit' ? 'update' : 'connect'} platform`);
      }

      return response.json();
    },
    onSuccess: () => {
      onSuccess?.();
      onClose();
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : `Failed to ${mode === 'edit' ? 'update' : 'connect'} platform`);
    },
  });

  const handleSubmit = () => {
    setError(null);

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    connectPlatform(email);
  };

  const platformName = PLATFORM_NAMES[platform] || platform;

  if (!isOpen) return null;

  return (
    <AnimatePresence onExitComplete={() => handleOpenChange(false)}>
      {/* Backdrop */}
      <motion.div
        key="manual-invitation-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
      />

      {/* Modal */}
      <motion.div
        key="manual-invitation-content"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', duration: 0.3 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
      >
        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden pointer-events-auto">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-indigo-50 to-white">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center">
                <Mail className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {mode === 'edit' ? `Update ${platformName}` : `Connect ${platformName}`}
                </h2>
                <p className="text-xs text-slate-600">
                  {mode === 'edit' ? 'Update invitation email' : 'Team invitation setup'}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                onClose();
                handleOpenChange(false);
              }}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-slate-500" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-5">
            {/* Info box */}
            <div className="mb-5 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900">
                  <p className="font-medium mb-1">How this works</p>
                  <p className="text-blue-800">
                    When requesting {platformName} account access, your client will invite{' '}
                    <span className="font-medium">this email address</span> to their {platformName} account.
                  </p>
                </div>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800"
              >
                {error}
              </motion.div>
            )}

            {/* Content */}
            <div>
              <div className="mb-5">
                <label htmlFor="invitation-email" className="block text-sm font-medium text-slate-900 mb-2">
                  Email to receive invitations
                </label>
                <input
                  id="invitation-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your-agency@example.com"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-colors"
                  disabled={isPending}
                  autoFocus
                />
                <p className="mt-2 text-xs text-slate-600">
                  This email will receive team invitations from your clients
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    handleOpenChange(false);
                  }}
                  disabled={isPending}
                  className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isPending || !email}
                  className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {mode === 'edit' ? 'Updating...' : 'Connecting...'}
                    </>
                  ) : (
                    mode === 'edit' ? 'Update' : 'Connect'
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="px-6 py-3 bg-slate-50 border-t border-slate-200">
            <p className="text-xs text-slate-600 text-center">
              You can change this email address later from your settings
            </p>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
