/**
 * ManualInvitationModal Component
 *
 * Modal for connecting agency platforms that use team invitation flow
 * instead of OAuth. Agencies provide either:
 * - Email address (for Kit, Mailchimp, Beehiiv, Klaviyo)
 * - Business ID (for Pinterest)
 *
 * Used for: Kit, Mailchimp, Beehiiv, Klaviyo, Pinterest
 */

'use client';

import { useState, useEffect } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { X, Loader2, Mail, Info, Building2, ExternalLink } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';

// Platform display names
const PLATFORM_NAMES: Record<string, string> = {
  kit: 'Kit',
  mailchimp: 'Mailchimp',
  beehiiv: 'Beehiiv',
  klaviyo: 'Klaviyo',
  pinterest: 'Pinterest',
  zapier: 'Zapier',
};

// Platforms that use Business ID instead of email
const BUSINESS_ID_PLATFORMS = ['pinterest'];

interface ManualInvitationModalProps {
  isOpen: boolean;
  onClose: () => void;
  platform: string; // 'kit' | 'mailchimp' | 'beehiiv' | 'klaviyo' | 'pinterest'
  agencyId: string;
  onSuccess?: () => void;
  mode?: 'create' | 'edit'; // 'create' for new connection, 'edit' to update email/businessId
  currentValue?: string; // Pre-filled value for edit mode
}

export function ManualInvitationModal({
  isOpen,
  onClose,
  platform,
  agencyId,
  onSuccess,
  mode = 'create',
  currentValue = '',
}: ManualInvitationModalProps) {
  const [value, setValue] = useState(currentValue || '');
  const [error, setError] = useState<string | null>(null);

  const isBusinessIdPlatform = BUSINESS_ID_PLATFORMS.includes(platform);
  const platformName = PLATFORM_NAMES[platform] || platform;

  // Reset form when modal opens
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setValue('');
      setError(null);
    }
  };

  // Update value when currentValue prop changes (for edit mode)
  useEffect(() => {
    if (mode === 'edit' && currentValue) {
      setValue(currentValue);
    }
  }, [mode, currentValue]);

  // Connect mutation
  const { mutate: connectPlatform, isPending } = useMutation({
    mutationFn: async (inputValue: string) => {
      const endpoint = mode === 'edit'
        ? `${process.env.NEXT_PUBLIC_API_URL}/agency-platforms/${platform}/manual-invitation`
        : `${process.env.NEXT_PUBLIC_API_URL}/agency-platforms/${platform}/manual-connect`;

      const method = mode === 'edit' ? 'PATCH' : 'POST';

      const body = isBusinessIdPlatform
        ? { agencyId, businessId: inputValue }
        : { agencyId, invitationEmail: inputValue };

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
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

    if (isBusinessIdPlatform) {
      // Validate Business ID (numeric, 1-20 digits)
      const businessIdRegex = /^\d{1,20}$/;
      if (!value || !businessIdRegex.test(value)) {
        setError('Please enter a valid Business ID (1-20 digits)');
        return;
      }
    } else {
      // Validate email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!value || !emailRegex.test(value)) {
        setError('Please enter a valid email address');
        return;
      }
    }

    connectPlatform(value);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence onExitComplete={() => handleOpenChange(false)}>
      {/* Backdrop */}
      <m.div
        key="manual-invitation-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
      />

      {/* Modal */}
      <m.div
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
                {isBusinessIdPlatform ? (
                  <Building2 className="h-5 w-5 text-indigo-600" />
                ) : (
                  <Mail className="h-5 w-5 text-indigo-600" />
                )}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {mode === 'edit' ? `Update ${platformName}` : `Connect ${platformName}`}
                </h2>
                <p className="text-xs text-slate-600">
                  {isBusinessIdPlatform ? 'Business partnership setup' : mode === 'edit' ? 'Update invitation email' : 'Team invitation setup'}
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
                  {isBusinessIdPlatform ? (
                    <p className="text-blue-800">
                      Your clients will use this Business ID to add your agency as a partner in their {platformName} Business Manager.
                    </p>
                  ) : (
                    <p className="text-blue-800">
                      When requesting {platformName} account access, your client will invite{' '}
                      <span className="font-medium">this email address</span> to their {platformName} account.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <m.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800"
              >
                {error}
              </m.div>
            )}

            {/* Content */}
            <div>
              <div className="mb-5">
                <label htmlFor={isBusinessIdPlatform ? 'business-id' : 'invitation-email'} className="block text-sm font-medium text-slate-900 mb-2">
                  {isBusinessIdPlatform ? 'Pinterest Business ID' : 'Email to receive invitations'}
                </label>
                <input
                  id={isBusinessIdPlatform ? 'business-id' : 'invitation-email'}
                  type={isBusinessIdPlatform ? 'text' : 'email'}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={isBusinessIdPlatform ? '1234567890' : 'your-agency@example.com'}
                  pattern={isBusinessIdPlatform ? '\\d{1,20}' : undefined}
                  maxLength={isBusinessIdPlatform ? 20 : undefined}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-colors"
                  disabled={isPending}
                  autoFocus
                />
                <p className="mt-2 text-xs text-slate-600">
                  {isBusinessIdPlatform
                    ? 'Your Pinterest Business ID (1-20 digits)'
                    : 'This email will receive team invitations from your clients'}
                </p>
              </div>

              {/* Find your Business ID helper - Pinterest only */}
              {isBusinessIdPlatform && (
                <div className="mb-5 p-4 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-slate-500 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-slate-900 mb-1">Find your Business ID</p>
                      <p className="text-slate-600 mb-2">
                        You can find your Pinterest Business ID in{' '}
                        <a
                          href={
                            value && /^\d{1,20}$/.test(value)
                              ? `https://www.pinterest.com/business/business-manager/${value}/settings/`
                              : 'https://www.pinterest.com/business/business-manager/'
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:text-indigo-700 font-medium inline-flex items-center gap-1"
                        >
                          Pinterest Business Manager
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </p>
                      <p className="text-slate-500 text-xs">
                        Go to Dashboard → Business settings to find your ID
                      </p>
                    </div>
                  </div>
                </div>
              )}

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
                  disabled={isPending || !value}
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
              {isBusinessIdPlatform
                ? 'You can change this Business ID later from your settings'
                : 'You can change this email address later from your settings'}
            </p>
          </div>
        </div>
      </m.div>
    </AnimatePresence>
  );
}
