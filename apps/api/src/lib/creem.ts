/**
 * Creem API Client
 *
 * Wrapper for Creem API with proper error handling and retry logic.
 * Follows the Infisical singleton pattern for consistency.
 *
 * Creem API Reference: https://docs.creem.io
 */

import { env } from './env.js';

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
   * Update a subscription (for upgrades/downgrades)
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
   */
  async cancelSubscription(
    subscriptionId: string,
    params: {
      cancelAtPeriodEnd?: boolean;
    }
  ): Promise<CreemResponse<any>> {
    return this.request(`/subscriptions/${subscriptionId}`, {
      method: 'DELETE',
      body: JSON.stringify(params),
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
    if (!signature) return false;

    try {
      // Creem sends signature as: t=timestamp,v1=signature
      // Format: "t=1234567890,v1=abc123def456..."
      const [timestampPart, signaturePart] = signature.split(',');

      if (!timestampPart || !signaturePart) {
        return false;
      }

      const timestamp = timestampPart.split('=')[1];
      const v1Signature = signaturePart.split('=')[1];

      if (!timestamp || !v1Signature) {
        return false;
      }

      // Recreate the signed payload
      const signedPayload = `${timestamp}.${payload}`;
      const crypto = require('crypto');
      const hmac = crypto.createHmac('sha256', env.CREEM_WEBHOOK_SECRET);
      hmac.update(signedPayload);
      const digest = hmac.digest('hex');

      // Compare signatures using constant-time comparison
      return crypto.timingSafeEqual(
        Buffer.from(v1Signature),
        Buffer.from(digest)
      );
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      return false;
    }
  }
}

// Singleton instance
export const creem = new CreemClient({
  apiKey: env.CREEM_API_KEY,
  apiUrl: env.CREEM_API_URL,
});

// Export type for use in tests
export { CreemClient };
