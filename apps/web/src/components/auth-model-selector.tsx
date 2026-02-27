/**
 * AuthModelSelector Component
 *
 * Simplified component showing Delegated Access as the single authorization model.
 * Client Authorization has been removed - Delegated Access is now the only model.
 */

'use client';

import { AlertCircle, Link as LinkIcon, CheckCircle2 } from 'lucide-react';
import { PLATFORM_NAMES } from '@agency-platform/shared';

interface AuthModelSelectorProps {
  agencyHasConnectedPlatforms?: Record<string, boolean>;
}

export function AuthModelSelector({
  agencyHasConnectedPlatforms = {},
}: AuthModelSelectorProps) {
  const hasAnyConnectedPlatform = Object.values(agencyHasConnectedPlatforms).some(Boolean);

  return (
    <div className="border-2 border-black rounded-lg overflow-hidden bg-paper">
      {/* Header */}
      <div className="px-5 py-4 border-b-2 border-black/10 bg-ink/5">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded flex items-center justify-center bg-teal/10 border border-teal/30">
            <LinkIcon className="h-5 w-5 text-teal-90" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-ink">Delegated Access</h3>
            <p className="text-sm text-gray-600">Use your agency's platform accounts</p>
          </div>
          {hasAnyConnectedPlatform && (
            <div className="flex items-center gap-1.5 text-sm text-teal-90 bg-teal/10 px-3 py-1.5 rounded-full border border-teal">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Active</span>
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      <div className="p-5">
        <p className="text-base text-gray-600 leading-relaxed">
          Your agency uses its own platform connections to manage the client's campaigns. You'll have full
          UI access to create, edit, and manage campaigns directly in the platform interfaces.
        </p>

        {/* Warning if no platforms connected */}
        {!hasAnyConnectedPlatform && (
          <div className="mt-4 p-4 bg-teal/5 border border-teal/30 rounded-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-teal-90 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-base font-medium text-ink">Platforms Required</p>
              <p className="text-sm text-gray-700 mt-1">
                You need to connect platforms to your agency before using delegated access.
              </p>
            </div>
          </div>
        )}

        {/* Connected Platforms Summary */}
        {hasAnyConnectedPlatform && (
          <div className="mt-4 pt-4 border-t-2 border-black/10">
            <p className="text-sm text-gray-600 mb-2">Connected platforms:</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(agencyHasConnectedPlatforms)
                .filter(([, connected]) => connected)
                .map(([platform]) => (
                  <span
                    key={platform}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-teal/10 border-2 border-teal rounded text-sm font-medium text-teal-90"
                  >
                    <span className="h-2 w-2 rounded-full bg-teal" />
                    {PLATFORM_NAMES[platform as keyof typeof PLATFORM_NAMES] || platform}
                  </span>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
