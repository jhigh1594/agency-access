'use client';

import type { GoogleAdsAccount } from '@agency-platform/shared';
import { getGoogleAdsAccountLabel } from '@/lib/google-ads-account-label';
import { SingleSelect } from '@/components/ui/single-select';
import { ManageAssetsStatusPanel } from './manage-assets-ui';

export interface GoogleManagerAccountSelectorProps {
  managerAccounts: GoogleAdsAccount[];
  value: string;
  onChange: (customerId: string, label: string) => void;
  disabled?: boolean;
}

export function GoogleManagerAccountSelector({
  managerAccounts,
  value,
  onChange,
  disabled = false,
}: GoogleManagerAccountSelectorProps) {
  return (
    <div className="space-y-3">
      <label className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        Manager account
      </label>
      <SingleSelect
        ariaLabel="Select Manager Account"
        options={managerAccounts.map((account) => ({
          value: account.id,
          label: getGoogleAdsAccountLabel(account),
        }))}
        value={value}
        onChange={onChange}
        placeholder="Select Manager Account..."
        disabled={disabled}
      />
      {managerAccounts.length === 0 && (
        <ManageAssetsStatusPanel
          label="MCC readiness"
          title="No eligible manager account found"
          description="Refresh Google accounts and connect an eligible Google Ads manager account before defaulting to MCC linking."
          tone="warning"
        />
      )}
    </div>
  );
}
