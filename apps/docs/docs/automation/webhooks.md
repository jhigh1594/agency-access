---
title: Webhooks
description: Send signed AgencyAccess lifecycle events to your CRM, automation stack, or internal systems.
slug: /automation/webhooks
sidebar_position: 1
keywords:
  - agencyaccess webhooks
  - signed webhooks
  - access request automation
  - crm webhook integration
tags:
  - automation
  - webhooks
---

# Webhooks

Use webhooks to send access request lifecycle events from AgencyAccess to your CRM, warehouse, or automation tool.

## Before you start

- You can configure one webhook endpoint per agency.
- Your destination must use `https://` in production.
- Local development receivers can use `http://localhost`.
- Your receiver must verify the signature using the raw request body.

## Quickstart

1. Open **Settings** -> **Webhooks**.
2. Enter the destination URL that should receive webhook events.
3. Choose the events you want to subscribe to.
4. Click **Create Endpoint**.
5. Copy the signing secret shown after creation and store it in your receiver.
6. Click **Send Test** to confirm your endpoint accepts signed requests.
7. Review the **Recent Deliveries** panel if the test fails.

## Event catalog

All webhook events use a versioned JSON envelope.

| Event | When it fires |
| --- | --- |
| `webhook.test` | When you click **Send Test** in settings. |
| `access_request.partial` | When an access request first moves into a partial-completion state. |
| `access_request.completed` | When an access request first moves into a completed state. |

## Request headers

Every delivery is sent as an HTTP `POST` with these headers:

| Header | Description |
| --- | --- |
| `Content-Type` | Always `application/json` |
| `X-AgencyAccess-Event` | Event type, such as `access_request.completed` |
| `X-AgencyAccess-Delivery-Id` | Unique ID for the delivery attempt |
| `X-AgencyAccess-Timestamp` | Unix timestamp used for signature generation |
| `X-AgencyAccess-Signature` | HMAC SHA-256 signature in `v1=<digest>` format |

## Payload examples

### `webhook.test`

```json
{
  "id": "evt_2b3cc1f0f7d84712a9d52d4f7b7b1f15",
  "type": "webhook.test",
  "apiVersion": "2026-03-08",
  "createdAt": "2026-03-08T18:00:00.000Z",
  "data": {
    "message": "This is a test webhook from Agency Access."
  }
}
```

### `access_request.completed`

```json
{
  "id": "evt_6208fd9f8d2d429d85b26afbbbe3d9e8",
  "type": "access_request.completed",
  "apiVersion": "2026-03-08",
  "createdAt": "2026-03-08T18:04:12.000Z",
  "data": {
    "accessRequest": {
      "id": "request_123",
      "status": "completed",
      "createdAt": "2026-03-07T11:10:00.000Z",
      "authorizedAt": "2026-03-08T18:03:59.000Z",
      "expiresAt": "2026-03-14T11:10:00.000Z",
      "requestUrl": "https://app.authhub.co/r/abc123",
      "clientPortalUrl": "https://app.authhub.co/requests/request_123",
      "requestedPlatforms": ["meta_ads", "google_ads"],
      "completedPlatforms": ["meta_ads", "google_ads"],
      "externalReference": "crm-8472"
    },
    "client": {
      "id": "client_123",
      "name": "Acme Fitness",
      "email": "owner@acmefitness.com",
      "company": "Acme Fitness"
    },
    "connections": [
      {
        "connectionId": "connection_123",
        "status": "active",
        "platforms": ["meta_ads", "google_ads"],
        "grantedAssetsSummary": {
          "accounts": 2,
          "pages": 1
        }
      }
    ]
  }
}
```

`access_request.partial` uses the same structure, but the `type`, `accessRequest.status`, and `completedPlatforms` values reflect the partial state.

## Signature verification

AgencyAccess signs the exact string:

```text
${timestamp}.${rawBody}
```

Use the `X-AgencyAccess-Timestamp` header value as `timestamp`, and verify against the raw request body before parsing the JSON.

### Node.js example

```js
import crypto from 'node:crypto';

export function verifyAgencyAccessSignature(rawBody, timestamp, signature, secret) {
  const expected = `v1=${crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.${rawBody}`)
    .digest('hex')}`;

  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}
```

### Python example

```python
import hashlib
import hmac

def verify_agencyaccess_signature(raw_body: str, timestamp: str, signature: str, secret: str) -> bool:
    signed = f"{timestamp}.{raw_body}".encode("utf-8")
    expected = "v1=" + hmac.new(secret.encode("utf-8"), signed, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature)
```

## Delivery and retry behavior

By default:

- Any `2xx` response is treated as a successful delivery.
- Timeouts, network failures, `429`, and `5xx` responses are retried.
- Other `4xx` responses are treated as final failures and are not retried automatically.
- Delivery timeout is `5000ms`.
- The system attempts delivery up to 6 times.
- Backoff starts at 30 seconds and increases exponentially, capped at 15 minutes.
- After 5 consecutive failures, the endpoint is disabled until you update or re-enable it from settings.

## Troubleshooting

### The test send never arrives

- Confirm the destination URL is correct.
- Make sure your receiver is reachable from the public internet.
- If you are testing locally, tunnel the endpoint or use `localhost` only from a local AgencyAccess environment.

### The receiver says the signature is invalid

- Verify against the raw request body, not a re-serialized JSON object.
- Use `X-AgencyAccess-Timestamp` exactly as received.
- Confirm you are using the latest signing secret after any rotation.

### Deliveries fail with `4xx`

- Your endpoint is reachable, but your application rejected the request.
- The most common causes are signature validation, auth middleware, or strict schema validation on your side.
- Review the response snippet in **Recent Deliveries** and fix the receiver before sending another test.

### Deliveries fail with `5xx` or time out

- Your endpoint accepted the connection but did not finish successfully.
- Check your application logs using `X-AgencyAccess-Delivery-Id` to find the exact failing request.
- If failures continue, AgencyAccess may disable the endpoint until you save or rotate it again.

### I need to correlate the event to my CRM record

Use `accessRequest.externalReference`. This optional field is available on request create and edit flows and is included in lifecycle webhook payloads.

## Next step

After your test event succeeds, subscribe to `access_request.partial` and `access_request.completed` and map them into your CRM or downstream automation.
