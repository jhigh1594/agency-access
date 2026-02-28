import type { BillingInterval } from '@agency-platform/shared';

export const BILLING_INTERVAL_STORAGE_KEY = 'selectedBillingInterval';

export function isBillingInterval(value: string | null | undefined): value is BillingInterval {
  return value === 'monthly' || value === 'yearly';
}

export function readBillingIntervalPreference(fallback: BillingInterval): BillingInterval {
  if (typeof window === 'undefined') return fallback;

  const storage = window.localStorage as Partial<Storage> | undefined;
  if (!storage || typeof storage.getItem !== 'function') {
    return fallback;
  }

  const storedValue = storage.getItem(BILLING_INTERVAL_STORAGE_KEY);
  if (isBillingInterval(storedValue)) {
    return storedValue;
  }

  return fallback;
}

export function persistBillingIntervalPreference(interval: BillingInterval): void {
  if (typeof window === 'undefined') return;

  const storage = window.localStorage as Partial<Storage> | undefined;
  if (!storage || typeof storage.setItem !== 'function') {
    return;
  }

  storage.setItem(BILLING_INTERVAL_STORAGE_KEY, interval);
}
