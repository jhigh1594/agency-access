# Webhooks Support Runbook

## Purpose

Operational guide for webhook support across:

- Agency self-serve settings: `/settings?tab=webhooks`
- Internal admin support view: `/internal/admin/webhooks`
- Agency API routes:
  - `GET /api/agencies/:agencyId/webhook-endpoint`
  - `PUT /api/agencies/:agencyId/webhook-endpoint`
  - `POST /api/agencies/:agencyId/webhook-endpoint/rotate-secret`
  - `POST /api/agencies/:agencyId/webhook-endpoint/disable`
  - `POST /api/agencies/:agencyId/webhook-endpoint/test`
  - `GET /api/agencies/:agencyId/webhook-deliveries`

## What support can answer

- Has the agency configured a webhook endpoint?
- Is the endpoint active or disabled?
- Which events is the agency subscribed to?
- Did recent deliveries succeed, fail, or stop before leaving the system?
- Did the receiver return a useful HTTP status or body snippet?

## Triage flow

1. Open `/internal/admin/webhooks`.
2. Search by agency name or agency email.
3. Inspect the selected endpoint summary.
4. Review the latest delivery attempt in the inspector.
5. Route the issue using the decision table below.

## Decision table

### No endpoint + no deliveries

Meaning:
- The agency has not configured webhooks yet.

Action:
- Direct the customer to `/settings?tab=webhooks`.
- Ask them to create the endpoint and send a test event.

### Endpoint exists + no deliveries

Meaning:
- No subscribed event has fired yet, or the delivery queue has not processed the event.

Action:
- Ask the customer to click **Send Test** first.
- Confirm the endpoint is `active`.
- If a test send still creates no delivery attempt, escalate to engineering for queue or job processing investigation.

### Failed deliveries with `4xx`

Meaning:
- AgencyAccess reached the endpoint, but the receiver rejected the request.

Common causes:
- Invalid signature verification
- Receiver auth middleware
- Schema validation mismatch
- Endpoint path is correct but application logic rejects the payload

Action:
- Ask the customer to inspect their receiver logs using `X-AgencyAccess-Delivery-Id`.
- Confirm they verify the signature against the raw request body.
- Recommend rotating the secret only if they suspect a stale secret is still in use.

### Failed deliveries with `5xx`

Meaning:
- The receiver accepted the HTTP request but errored internally.

Action:
- Tell the customer the issue is on the receiving application side.
- Share the response status, response snippet, and timestamp from the inspector.
- Ask them to retry with **Send Test** after fixing their handler.

### Network failures or timeouts

Meaning:
- The endpoint could not be reached reliably or did not respond within the delivery timeout.

Action:
- Confirm the endpoint is publicly reachable and not blocked by IP allowlists, VPN requirements, or firewall rules.
- Confirm the receiver responds within 5 seconds.
- If the endpoint stays unreachable, deliveries will retry automatically until the endpoint disables.

### Endpoint disabled

Meaning:
- The endpoint hit the repeated-failure threshold and was automatically disabled, or the agency disabled it manually.

Action:
- Have the agency fix the receiver first.
- Then ask them to save the endpoint again or rotate the secret from settings to resume active delivery.

## Escalation rules

### Support-owned

- Missing endpoint configuration
- Wrong destination URL
- Signature verification setup mistakes
- Handling customer questions about event types or payload fields
- Interpreting `4xx` and `5xx` delivery responses

### Escalate to API engineering

- Test send is accepted in UI but no delivery attempt is created
- Multiple agencies report missing webhook deliveries at the same time
- Queue worker or Redis outage is suspected
- Payload contents do not match the documented schema
- Response snippets or persisted attempt status appear incorrect

### Escalate to product/engineering together

- Customer needs multiple endpoints per agency
- Customer requests replay APIs or historical backfill
- Customer needs event types outside the phase-1 catalog

## Customer-safe talking points

- AgencyAccess sends signed JSON webhooks for `webhook.test`, `access_request.partial`, and `access_request.completed`.
- Delivery succeeds on any `2xx` response.
- Retries happen automatically for timeouts, network errors, `429`, and `5xx` responses.
- The signing secret is only shown on create and rotate, so it must be stored when displayed.

## Verification checklist for support

1. Endpoint URL is correct and status is understood.
2. Subscribed events match what the customer expects.
3. Latest delivery attempt has been inspected.
4. Customer has the delivery ID, timestamp, and response details they need.
5. Escalation includes the agency ID, endpoint URL, delivery ID, and a short description of the suspected failure mode.
