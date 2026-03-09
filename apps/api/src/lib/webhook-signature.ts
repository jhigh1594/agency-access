import { createHmac, timingSafeEqual } from 'node:crypto';

export function signWebhookPayload(
  payload: string,
  secret: string,
  timestamp: string
): string {
  const digest = createHmac('sha256', secret)
    .update(`${timestamp}.${payload}`)
    .digest('hex');

  return `v1=${digest}`;
}

export function verifyWebhookPayloadSignature(
  payload: string,
  signature: string,
  secret: string,
  timestamp: string
): boolean {
  if (!signature || !secret || !timestamp) {
    return false;
  }

  const [version, digest] = signature.split('=');
  if (version !== 'v1' || !digest || !/^[a-f0-9]{64}$/i.test(digest)) {
    return false;
  }

  const expected = signWebhookPayload(payload, secret, timestamp);
  const [, expectedDigest] = expected.split('=');

  if (!expectedDigest || expectedDigest.length !== digest.length) {
    return false;
  }

  return timingSafeEqual(
    Buffer.from(digest, 'hex'),
    Buffer.from(expectedDigest, 'hex')
  );
}
