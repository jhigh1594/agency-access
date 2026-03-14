---
title: Fix Client Authorization Issues
description: Troubleshoot cases where a client starts the flow but cannot finish due to platform errors, permission gaps, or expired request state.
slug: /troubleshooting/client-auth-issues
sidebar_position: 2
keywords:
  - client authorization failed
  - oauth onboarding issue
  - request troubleshooting
tags:
  - troubleshooting
---

# Fix Client Authorization Issues

When a client starts but cannot complete the flow, isolate whether the issue is the request, the client account, or the external platform.

## Check these first

1. Is the request still active?
2. Is the client signed into the correct platform account?
3. Does the client have the permissions needed to grant access?
4. Did the platform redirect or error out mid-flow?

## Common outcomes

- **Expired request:** create or resend a valid request.
- **Wrong platform account:** ask the client to restart with the correct admin login.
- **Permission gap:** the client must involve the correct owner or admin.
- **Third-party platform error:** retry once, then escalate with context and screenshots if the issue persists.

## What to capture before escalating

- Request ID or link context.
- Platform name.
- Exact step where the client got blocked.
- Whether the issue is repeatable.
