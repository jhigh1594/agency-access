---
title: Check Request Status
description: Use AuthHub request status to understand whether a client has opened, started, completed, or stalled a platform authorization flow.
slug: /requests-and-links/check-request-status
sidebar_position: 2
keywords:
  - authhub request status
  - authorization progress
  - pending client request
tags:
  - requests
---

# Check Request Status

AuthHub tracks request progress so your team can manage onboarding from one dashboard instead of chasing status updates manually.

## Statuses you will see

| Status | Meaning | What to do |
| --- | --- | --- |
| `Pending` | The client has not completed the request yet. | Confirm they received the link and know who should act on it. |
| `Partial` | Some requested platforms are complete, but not all. | Review which platforms remain and follow up on the blocker. |
| `Completed` | All requested authorizations are done. | Move into delivery or campaign setup. |
| `Expired` | The request is no longer valid. | Create a fresh link or resend if your workflow allows it. |
| `Revoked` | Access or the request was intentionally withdrawn. | Reissue only after confirming the reason. |

## How to use status operationally

- Use `Pending` to trigger the first reminder.
- Use `Partial` to identify whether a specific platform is causing friction.
- Treat `Expired` as a workflow restart, not a minor follow-up.

## When to escalate

Escalate internally if:

- the client claims they completed the flow but the request is still `Pending`,
- a required platform remains incomplete after multiple reminders,
- or a revocation affects an active engagement.

## Related

- [Resend or revoke a request](/requests-and-links/resend-or-revoke)
- [Common client blockers](/troubleshooting/common-client-blockers)
