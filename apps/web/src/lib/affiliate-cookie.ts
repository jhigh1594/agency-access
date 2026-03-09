export const AFFILIATE_CLICK_COOKIE = 'ah_aff_click';
export const AFFILIATE_CLICK_PENDING_COOKIE = 'ah_aff_click_pending';

function getCookieValue(name: string): string | null {
  if (typeof document === 'undefined') return null;

  const cookie = document.cookie
    .split('; ')
    .find((entry) => entry.startsWith(`${name}=`));

  if (!cookie) return null;
  const value = cookie.slice(`${name}=`.length);
  return value || null;
}

export function getAffiliateClickTokenFromDocument(): string | null {
  return getCookieValue(AFFILIATE_CLICK_COOKIE);
}

export function hasPendingAffiliateClickFromDocument(): boolean {
  return getCookieValue(AFFILIATE_CLICK_PENDING_COOKIE) === '1';
}

export function clearPendingAffiliateClickFromDocument() {
  if (typeof document === 'undefined') return;
  document.cookie = `${AFFILIATE_CLICK_PENDING_COOKIE}=; Max-Age=0; Path=/; SameSite=Lax`;
}
