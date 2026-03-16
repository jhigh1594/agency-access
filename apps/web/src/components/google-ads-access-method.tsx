'use client';

/**
 * Google Ads Access Method
 *
 * Account-level choice between Manager Account (MCC) and Client Email Invite.
 * Compact segmented control on desktop, stacked on mobile.
 */

import type { GoogleAdsGrantMode } from '@agency-platform/shared';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GoogleManagerAccountSelector } from './google-manager-account-selector';
import { GoogleInviteEmailInput } from './google-invite-email-input';
import type { GoogleAdsAccount } from '@agency-platform/shared';

const MCC_TOOLTIP =
  "We'll try your manager account first. If MCC linking isn't eligible, we'll safely fall back to a direct user invite and log why it changed modes.";

export interface GoogleAdsAccessMethodProps {
  preferredGrantMode: GoogleAdsGrantMode;
  managerAccounts: GoogleAdsAccount[];
  managerCustomerId: string;
  managerAccountLabel?: string;
  inviteEmail: string;
  onUpdate: (updates: Record<string, unknown>) => void;
  disabled?: boolean;
}

export function GoogleAdsAccessMethod({
  preferredGrantMode,
  managerAccounts,
  managerCustomerId,
  inviteEmail,
  onUpdate,
  disabled = false,
}: GoogleAdsAccessMethodProps) {
  return (
    <div className="space-y-3">
      <div
        className="flex flex-col sm:flex-row sm:gap-0 rounded-[1rem] border-2 border-black overflow-hidden"
        role="radiogroup"
        aria-label="Google Ads access method"
      >
        <button
          type="button"
          role="radio"
          aria-checked={preferredGrantMode === 'manager_link'}
          aria-disabled={disabled}
          disabled={disabled}
          onClick={() => !disabled && onUpdate({ preferredGrantMode: 'manager_link' })}
          className={cn(
            'relative flex-1 min-h-[44px] px-4 py-3 flex items-center justify-center gap-2 border-r-0 sm:border-r-2 sm:border-b-0 border-b-2 sm:border-b-0 border-black text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-[rgb(var(--coral))] focus:ring-offset-2',
            preferredGrantMode === 'manager_link'
              ? 'bg-card shadow-brutalist-sm'
              : 'bg-paper hover:bg-paper/90',
            disabled && 'cursor-not-allowed opacity-60'
          )}
          aria-label="Manager account (MCC)"
        >
          <span className="text-ink">Manager account (MCC)</span>
          <span className="inline-flex items-center rounded-full border-2 border-black bg-[rgb(var(--coral))] px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-white shadow-brutalist-sm shrink-0">
            Recommended
          </span>
          <div
            className="group relative shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <Info
              className="h-4 w-4 text-muted-foreground cursor-help"
              aria-label="More information"
            />
            <div className="absolute bottom-full left-1/2 z-10 mb-2 w-56 -translate-x-1/2 rounded border border-border bg-ink p-2 text-[10px] text-white shadow-brutalist opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 pointer-events-none">
              {MCC_TOOLTIP}
            </div>
          </div>
        </button>

        <button
          type="button"
          role="radio"
          aria-checked={preferredGrantMode === 'user_invite'}
          aria-disabled={disabled}
          disabled={disabled}
          onClick={() => !disabled && onUpdate({ preferredGrantMode: 'user_invite' })}
          className={cn(
            'flex-1 min-h-[44px] px-4 py-3 flex items-center justify-center text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-[rgb(var(--coral))] focus:ring-offset-2',
            preferredGrantMode === 'user_invite'
              ? 'bg-card shadow-brutalist-sm'
              : 'bg-paper hover:bg-paper/90 border-t-2 sm:border-t-0 sm:border-l-0 border-black',
            disabled && 'cursor-not-allowed opacity-60'
          )}
          aria-label="Client email invite"
        >
          Client email invite
        </button>
      </div>

      {preferredGrantMode === 'manager_link' && (
        <div className="pt-1 pb-2">
          <GoogleManagerAccountSelector
            managerAccounts={managerAccounts}
            value={managerCustomerId}
            onChange={(customerId, label) =>
              onUpdate({ managerCustomerId: customerId, managerAccountLabel: label })
            }
            disabled={disabled}
          />
        </div>
      )}

      {preferredGrantMode === 'user_invite' && (
        <div className="pt-1 pb-2">
          <GoogleInviteEmailInput
            value={inviteEmail}
            onChange={(email) => onUpdate({ inviteEmail: email })}
            placeholder="client@example.com"
            disabled={disabled}
          />
        </div>
      )}
    </div>
  );
}
