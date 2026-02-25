import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Verify a Creem webhook signature.
 * Header format: t=<timestamp>,v1=<hex_signature>
 */
export function verifyCreemWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  if (!signature || !secret) return false;

  try {
    let timestamp: string | null = null;
    let v1Signature: string | null = null;

    for (const part of signature.split(',')) {
      const [rawKey, ...rawValue] = part.trim().split('=');
      if (!rawKey || rawValue.length === 0) continue;

      const value = rawValue.join('=').trim();
      if (rawKey === 't') timestamp = value;
      if (rawKey === 'v1') v1Signature = value;
    }

    if (!timestamp || !v1Signature) return false;
    if (!/^[a-fA-F0-9]+$/.test(v1Signature) || v1Signature.length % 2 !== 0) return false;

    const signedPayload = `${timestamp}.${payload}`;
    const digest = createHmac('sha256', secret).update(signedPayload).digest('hex');

    if (v1Signature.length !== digest.length) return false;

    return timingSafeEqual(
      Buffer.from(v1Signature, 'hex'),
      Buffer.from(digest, 'hex')
    );
  } catch {
    return false;
  }
}
