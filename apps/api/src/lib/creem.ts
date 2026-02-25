/**
 * Creem API Client
 *
 * Wrapper for Creem API with proper error handling and retry logic.
 * Follows the Infisical singleton pattern for consistency.
 *
 * Creem API Reference: https://docs.creem.io
 */

import { env } from './env.js';
import { verifyCreemWebhookSignature } from './creem-signature.js';

export interface CreemConfig {
  apiKey: string;
  apiUrl: string;
}

export interface CreemError {
  code: string;
  message: string;
  details?: any;
}

export interface CreemResponse<T> {
  data: T | null;
  error: CreemError | null;
}

class CreemClient {
  private config: CreemConfig;
  private baseURL: string;

  constructor(config: CreemConfig) {
    this.config = config;
    this.baseURL = config.apiUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<CreemResponse<T>> {
    try {
      const url = `${this.baseURL}${endpoint}`;

      const response = await fetch(url, {
        ...options,
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      const result = await response.json() as any;

      if (!response.ok) {
        return {
          data: null,
          error: {
            code: result.error?.code || 'CREEM_API_ERROR',
            message: result.error?.message || 'Creem API request failed',
            details: result,
          },
        };
      }

      // Creem returns data in different formats - normalize to { data, error }
      return { data: result.data || result, error: null };
    } catch (error) {
      return {
        data: null,
        error: {
          code: 'CREEM_NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'Network request failed',
        },
      };
    }
  }

  // ============================================================
  // CUSTOMER OPERATIONS
  // ============================================================

  /**
   * Create a new customer in Creem
   */
  async createCustomer(params: {
    email: string;
    name?: string;
    metadata?: Record<string, any>;
  }): Promise<CreemResponse<any>> {
    return this.request('/customers', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Retrieve a customer by ID
   */
  async retrieveCustomer(customerId: string): Promise<CreemResponse<any>> {
    return this.request(`/customers/${customerId}`);
  }

  /**
   * Update a customer
   */
  async updateCustomer(
    customerId: string,
    params: {
      email?: string;
      name?: string;
      metadata?: Record<string, any>;
    }
  ): Promise<CreemResponse<any>> {
    return this.request(`/customers/${customerId}`, {
      method: 'PATCH',
      body: JSON.stringify(params),
    });
  }

  // ============================================================
  // CHECKOUT SESSIONS
  // ============================================================

  /**
   * Create a checkout session for one-time payment or subscription
   */
  async createCheckoutSession(params: {
    customer?: string;
    customerEmail?: string;
    productId: string;
    successUrl: string;
    cancelUrl: string;
    metadata?: Record<string, any>;
  }): Promise<CreemResponse<any>> {
    return this.request('/checkout/sessions', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  // ============================================================
  // SUBSCRIPTION OPERATIONS
  // ============================================================

  /**
   * Retrieve a subscription by ID
   */
  async retrieveSubscription(subscriptionId: string): Promise<CreemResponse<any>> {
    return this.request(`/subscriptions/${subscriptionId}`);
  }

  /**
   * Upgrade or downgrade a subscription to a different product
   * Uses Creem's dedicated upgrade endpoint with proration options
   *
   * @param subscriptionId - The subscription to upgrade
   * @param params - Upgrade parameters
   * @param params.productId - The new product ID to upgrade/downgrade to
   * @param params.updateBehavior - How to handle proration:
   *   - "proration-charge-immediately": Charge difference immediately, new cycle starts
   *   - "proration-charge": Credit applied to next invoice, keeps current cycle
   *   - "proration-none": No proration, change takes effect next cycle
   */
  async upgradeSubscription(
    subscriptionId: string,
    params: {
      productId: string;
      updateBehavior?: 'proration-charge-immediately' | 'proration-charge' | 'proration-none';
    }
  ): Promise<CreemResponse<any>> {
    return this.request(`/subscriptions/${subscriptionId}/upgrade`, {
      method: 'POST',
      body: JSON.stringify({
        product_id: params.productId,
        update_behavior: params.updateBehavior || 'proration-charge',
      }),
    });
  }

  /**
   * Update subscription items (for seat-based billing)
   * Use this to modify the quantity/units of subscription items
   *
   * @param subscriptionId - The subscription to update
   * @param params - Update parameters
   * @param params.items - Array of items with updated units
   * @param params.updateBehavior - Proration behavior (same as upgrade)
   */
  async updateSubscriptionItems(
    subscriptionId: string,
    params: {
      items: Array<{
        id: string; // Item ID from subscription
        units: number; // New quantity/seat count
      }>;
      updateBehavior?: 'proration-charge-immediately' | 'proration-charge' | 'proration-none';
    }
  ): Promise<CreemResponse<any>> {
    return this.request(`/subscriptions/${subscriptionId}`, {
      method: 'POST',
      body: JSON.stringify({
        items: params.items.map(item => ({
          id: item.id,
          units: item.units,
        })),
        update_behavior: params.updateBehavior || 'proration-charge',
      }),
    });
  }

  /**
   * Update subscription metadata
   * @deprecated Use upgradeSubscription for tier changes
   */
  async updateSubscription(
    subscriptionId: string,
    params: {
      productId?: string;
      prorationBehavior?: 'create_prorations' | 'none';
      metadata?: Record<string, any>;
    }
  ): Promise<CreemResponse<any>> {
    return this.request(`/subscriptions/${subscriptionId}`, {
      method: 'PATCH',
      body: JSON.stringify(params),
    });
  }

  /**
   * Cancel a subscription
   *
   * @param subscriptionId - The subscription to cancel
   * @param params - Cancellation parameters
   * @param params.cancelAtPeriodEnd - If true, cancels at period end. If false, cancels immediately.
   */
  async cancelSubscription(
    subscriptionId: string,
    params: {
      cancelAtPeriodEnd?: boolean;
    }
  ): Promise<CreemResponse<any>> {
    return this.request(`/subscriptions/${subscriptionId}`, {
      method: 'DELETE',
      body: JSON.stringify({
        cancel_at_period_end: params.cancelAtPeriodEnd ?? true,
      }),
    });
  }

  // ============================================================
  // CUSTOMER PORTAL
  // ============================================================

  /**
   * Create a portal session for self-service subscription management
   */
  async createPortalSession(params: {
    customer: string;
    returnUrl: string;
  }): Promise<CreemResponse<any>> {
    return this.request('/billing_portal/sessions', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  // ============================================================
  // INVOICE OPERATIONS
  // ============================================================

  /**
   * List invoices for a customer
   */
  async listInvoices(params: {
    customer: string;
    limit?: number;
    startingAfter?: string;
  }): Promise<CreemResponse<any[]>> {
    const queryParams = new URLSearchParams();
    if (params.limit) queryParams.set('limit', params.limit.toString());
    if (params.startingAfter) queryParams.set('starting_after', params.startingAfter);

    const queryString = queryParams.toString();
    return this.request(`/invoices?${queryString}`);
  }

  // ============================================================
  // WEBHOOK SIGNATURE VERIFICATION
  // ============================================================

  /**
   * Verify webhook signature from Creem
   * Creem uses HMAC SHA256 signatures
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    return verifyCreemWebhookSignature(payload, signature, env.CREEM_WEBHOOK_SECRET);
  }
}

// Singleton instance
export const creem = new CreemClient({
  apiKey: env.CREEM_API_KEY,
  apiUrl: env.CREEM_API_URL,
});

// Export type for use in tests
export { CreemClient };
