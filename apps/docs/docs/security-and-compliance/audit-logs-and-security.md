---
title: Audit Logs and Security
description: Understand how AuthHub handles client authorization activity, audit visibility, and the security expectations around platform access workflows.
slug: /security-and-compliance/audit-logs-and-security
sidebar_position: 1
keywords:
  - audit logs
  - authhub security
  - client access compliance
tags:
  - security
---

# Audit Logs and Security

AuthHub is designed so agencies can request and manage access without resorting to password sharing or ad hoc spreadsheets.

## Core security model

- Clients authorize through official platform flows.
- Agencies should not collect raw platform passwords.
- Operational access events should be traceable.

## Why audit logs matter

Audit visibility helps your team answer:

- who accessed or used a token-backed workflow,
- what action happened,
- when it happened,
- and which user or client context it affected.

## Recommended team behavior

- Use named accounts, not shared logins.
- Keep request scope as narrow as the work requires.
- Revoke or replace requests when context changes materially.
- Treat access events as compliance evidence, not just debugging information.
