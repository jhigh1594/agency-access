/**
 * Billing API Client
 *
 * Centralized functions for billing/subscription API calls.
 */

import type { SubscriptionTier, TierLimits } from '@agency-platform/shared';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface SubscriptionData {
  id: string;
  tier: SubscriptionTier;
  status: 'active' | 'canceled' | 'past_due' | 'incomplete';
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd: boolean;
}

export interface TierDetailsData {
  tier: SubscriptionTier;
  status: string;
  limits: TierLimits;
  features: string[];
}

export interface Invoice {
  id: string;
  amount: number;
  currency: string;
  status: 'paid' | 'open' | 'void' | 'uncollectible';
  invoiceDate: string;
  pdfUrl?: string;
}

export interface PaymentMethod {
  id: string;
  type: 'card';
  last4: string;
  brand: string;
  expiryMonth: number;
  expiryYear: number;
  isDefault: boolean;
}

export interface BillingDetails {
  companyName?: string;
  email?: string;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
}

export async function fetchSubscription(
  orgId: string,
  token: string
): Promise<SubscriptionData | null> {
  const response = await fetch(`${API_URL}/api/subscriptions/${orgId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Failed to fetch subscription');
  const result = await response.json();
  return result.data;
}

export async function fetchTierDetails(
  orgId: string,
  token: string
): Promise<TierDetailsData> {
  const response = await fetch(`${API_URL}/api/subscriptions/${orgId}/tier`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Failed to fetch tier details');
  const result = await response.json();
  return result.data;
}

export async function fetchInvoices(
  orgId: string,
  token: string
): Promise<Invoice[]> {
  const response = await fetch(`${API_URL}/api/subscriptions/${orgId}/invoices`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Failed to fetch invoices');
  const result = await response.json();
  return result.data || [];
}

export async function fetchPaymentMethods(
  orgId: string,
  token: string
): Promise<PaymentMethod[]> {
  const response = await fetch(`${API_URL}/api/subscriptions/${orgId}/payment-methods`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Failed to fetch payment methods');
  const result = await response.json();
  return result.data || [];
}

export async function fetchBillingDetails(
  orgId: string,
  token: string
): Promise<BillingDetails> {
  const response = await fetch(`${API_URL}/api/subscriptions/${orgId}/billing-details`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Failed to fetch billing details');
  const result = await response.json();
  return result.data || {};
}

export async function updateBillingDetails(
  orgId: string,
  token: string,
  details: BillingDetails
): Promise<BillingDetails> {
  const response = await fetch(`${API_URL}/api/subscriptions/${orgId}/billing-details`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(details),
  });
  if (!response.ok) throw new Error('Failed to update billing details');
  const result = await response.json();
  return result.data;
}

export async function createPortalSession(
  orgId: string,
  token: string,
  returnUrl: string
): Promise<{ portalUrl: string }> {
  const response = await fetch(`${API_URL}/api/subscriptions/portal`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ agencyId: orgId, returnUrl }),
  });
  if (!response.ok) throw new Error('Failed to create portal session');
  const result = await response.json();
  return result.data;
}

export async function createCheckoutSession(
  orgId: string,
  token: string,
  tier: SubscriptionTier,
  successUrl: string,
  cancelUrl: string
): Promise<{ checkoutUrl: string }> {
  const response = await fetch(`${API_URL}/api/subscriptions/checkout`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ agencyId: orgId, tier, successUrl, cancelUrl }),
  });
  if (!response.ok) throw new Error('Failed to create checkout session');
  const result = await response.json();
  return result.data;
}
