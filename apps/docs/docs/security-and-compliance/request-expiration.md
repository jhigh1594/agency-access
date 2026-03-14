---
title: Request Expiration Behavior
description: Learn how expiration affects access requests, how to recover from expired links, and how to keep agency workflows from stalling.
slug: /security-and-compliance/request-expiration
sidebar_position: 2
keywords:
  - request expiration
  - expired access link
  - authhub link lifecycle
tags:
  - security
---

# Request Expiration Behavior

Access requests do not stay open forever. Expiration keeps old links from becoming stale operational liabilities.

## Default expectation

Requests expire after a fixed validity window. If the link is no longer active, the client should not keep retrying the same request indefinitely.

## What to do when a request expires

1. Confirm whether the original scope is still correct.
2. Create a replacement request if the work still needs to happen.
3. Send the new link with a short note explaining that the previous request expired.

## Avoid repeat expiration

- Send the request to the correct approver first.
- Follow up while the request is still active.
- Recreate only after checking whether scope or ownership changed.
