'use client';

/**
 * Google Ads Access Method
 *
 * Account-level choice between Manager Account (MCC) and Client Email Invite.
 * Replaces "defaults" language with clear radio-card selection and progressive disclosure.
 */

import type { GoogleAdsGrantMode } from '@agency-platform/shared';
import { RadioCard } from '@/components/ui/radio-card';
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
    <div className="space-y-4">
      <div className="space-y-3" role="radiogroup" aria-label="Google Ads access method">
        <RadioCard
          value="manager_link"
          label="Manager account (MCC)"
          description="Link clients to your Google Ads manager account for centralized access."
          badge="Recommended"
          tooltip={MCC_TOOLTIP}
          isSelected={preferredGrantMode === 'manager_link'}
          onChange={() => onUpdate({ preferredGrantMode: 'manager_link' })}
          disabled={disabled}
        />

        <RadioCard
          value="user_invite"
          label="Client email invite"
          description="Send a direct invite to a specific Google login email."
          isSelected={preferredGrantMode === 'user_invite'}
          onChange={() => onUpdate({ preferredGrantMode: 'user_invite' })}
          disabled={disabled}
        />
      </div>

      {preferredGrantMode === 'manager_link' && (
        <div className="pl-0 pt-1">
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
        <div className="pl-0 pt-1">
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
