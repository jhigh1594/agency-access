import type { GoogleAdsAccount } from '@agency-platform/shared';

function formatGoogleAdsAccountId(accountId: string): string {
  if (accountId.length !== 10) {
    return accountId;
  }

  return `${accountId.slice(0, 3)}-${accountId.slice(3, 6)}-${accountId.slice(6)}`;
}

export function getGoogleAdsAccountLabel(account: Pick<GoogleAdsAccount, 'id' | 'name' | 'formattedId' | 'nameSource'>): string {
  const formattedId = account.formattedId || formatGoogleAdsAccountId(account.id);

  if (account.nameSource === 'fallback') {
    return account.name || `Unnamed Google Ads account • ${formattedId}`;
  }

  return `${account.name} • ${formattedId}`;
}

