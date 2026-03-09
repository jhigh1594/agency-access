import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  signWebhookPayload,
  verifyWebhookPayloadSignature,
} from '@/lib/webhook-signature';

describe('webhook-signature', () => {
  const payload = JSON.stringify({ id: 'evt_123', type: 'webhook.test' });
  const secret = 'whsec_test_secret';
  const timestamp = '1741392000';

  it('creates a v1 HMAC SHA-256 signature over timestamp and raw payload', () => {
    const signature = signWebhookPayload(payload, secret, timestamp);
    const expected = createHmac('sha256', secret)
      .update(`${timestamp}.${payload}`)
      .digest('hex');

    expect(signature).toBe(`v1=${expected}`);
  });

  it('verifies a valid webhook payload signature', () => {
    const signature = signWebhookPayload(payload, secret, timestamp);

    expect(
      verifyWebhookPayloadSignature(payload, signature, secret, timestamp)
    ).toBe(true);
  });

  it('rejects a signature created with a different secret', () => {
    const signature = signWebhookPayload(payload, secret, timestamp);

    expect(
      verifyWebhookPayloadSignature(payload, signature, 'wrong_secret', timestamp)
    ).toBe(false);
  });

  it('rejects malformed signature headers', () => {
    expect(
      verifyWebhookPayloadSignature(payload, 'not-a-valid-header', secret, timestamp)
    ).toBe(false);
  });
});
