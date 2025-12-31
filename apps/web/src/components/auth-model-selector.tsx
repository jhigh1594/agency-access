/**
 * AuthModelSelector Component
 *
 * Simplified component showing Delegated Access as the single authorization model.
 * Client Authorization has been removed - Delegated Access is now the only model.
 */

'use client';

import { AlertCircle, Link as LinkIcon, CheckCircle2 } from 'lucide-react';
import { AuthModel } from '@agency-platform/shared';

interface AuthModelSelectorProps {
  agencyHasConnectedPlatforms?: Record<string, boolean>;
}

export function AuthModelSelector({
  agencyHasConnectedPlatforms = {},
}: AuthModelSelectorProps) {
  const hasAnyConnectedPlatform = Object.values(agencyHasConnectedPlatforms).some(Boolean);

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-slate-50 px-5 py-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded bg-indigo-100 flex items-center justify-center">
            <LinkIcon className="h-5 w-5 text-indigo-700" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-slate-900">Delegated Access</h3>
            <p className="text-sm text-slate-500">Use your agency's platform accounts</p>
          </div>
          {hasAnyConnectedPlatform && (
            <div className="flex items-center gap-1.5 text-sm text-green-700 bg-green-50 px-3 py-1.5 rounded-full border border-green-200">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Active</span>
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      <div className="p-5">
        <p className="text-base text-slate-600 leading-relaxed">
          Your agency uses its own platform connections to manage the client's campaigns. You'll have full
          UI access to create, edit, and manage campaigns directly in the platform interfaces.
        </p>

        {/* Warning if no platforms connected */}
        {!hasAnyConnectedPlatform && (
          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-base font-medium text-amber-900">Platforms Required</p>
              <p className="text-sm text-amber-800 mt-1">
                You need to connect platforms to your agency before using delegated access.
              </p>
            </div>
          </div>
        )}

        {/* Connected Platforms Summary */}
        {hasAnyConnectedPlatform && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-sm text-slate-500 mb-2">Connected platforms:</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(agencyHasConnectedPlatforms)
                .filter(([, connected]) => connected)
                .map(([platform]) => (
                  <span
                    key={platform}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded text-sm font-medium text-green-800"
                  >
                    <span className="h-2 w-2 rounded-full bg-green-600" />
                    {platform}
                  </span>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
