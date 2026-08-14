---
title: Connect an Agent to AuthHub
description: Connect a compatible MCP agent to AuthHub with scoped permissions, owner approval, and auditable access operations.

sidebar_position: 1
keywords:
  - AuthHub agent
  - MCP connection
  - agent access
  - personal agent
  - agent approval
tags:
  - agents
  - mcp
  - security
---

# Connect an Agent to AuthHub

AuthHub supports compatible personal agents through a remote MCP endpoint. An agent can inspect your agency workspace, check connection readiness, prepare onboarding work, and report operation status. It does not receive provider passwords or OAuth tokens.

## Before you start

- Your agency has access to **Settings → Agents**.
- Your MCP client supports Streamable HTTP and OAuth protected-resource discovery.
- You can sign in to AuthHub as the agency owner.

## Connect the agent

1. Open **Settings → Agents** in AuthHub.
2. Copy the MCP endpoint shown on the page. It has this form:

   ```text
   https://<api-host>/mcp
   ```

3. Add the endpoint to your MCP client.
4. Complete the AuthHub sign-in flow in the browser.
5. If the client returns `AGENT_GRANT_REQUIRED`, open the setup URL from the response as the agency owner.
6. Review the agent name and capability set, then connect the agent.
7. Retry the MCP call.

AuthHub reloads the grant on every request. A revoked grant cannot continue to use an old access token.

## Choose the smallest useful capability set

Agent access is scoped to the grant. Start with read permissions, then add a write permission only when the agent needs it.

| Capability | Permission | Use it for |
| --- | --- | --- |
| Workspace | `workspace:read` | Read a bounded agency snapshot. |
| Clients | `clients:read`, `clients:write` | Read, create, or update client profiles. |
| Templates | `templates:read` | Read request templates. |
| Connections | `connections:read`, `connections:handoff` | Check readiness or return a human connection handoff. |
| Requests | `requests:read`, `requests:prepare`, `requests:dispatch`, `requests:cancel` | Read requests or prepare approved onboarding and cancellation work. |
| Operations | `operations:read` | Read operation status and recent agent activity. |
| Agency profile | `agency:write` | Update the agency name, website, or logo URL. |

The onboarding preparation tool requires both `requests:prepare` and `requests:dispatch`. Granting a dispatch permission does not remove the owner approval step.

## Understand the approval flow

Read operations can run within the grant. Reversible writes are idempotent and audited. Consequential work uses this sequence:

1. The agent prepares the operation.
2. AuthHub returns an `operationId`, `pending_approval` status, approval URL, and expiry.
3. The owner opens the URL and approves or declines the operation.
4. The agent executes the approved operation and reads the durable result.

Preparing onboarding does not create or email an access request. Preparing cancellation does not cancel the request. Provider OAuth consent, passwords, CAPTCHAs, terms acceptance, and client authorization remain human actions.

Use the same idempotency key when retrying the same intent. Reusing a key with different intent returns `IDEMPOTENCY_CONFLICT`.

## Manage or revoke access

In **Settings → Agents**, you can:

- rename an active agent;
- change its capability set;
- revoke access immediately.

Revocation blocks new calls and cancels prepared, pending, or approved operations that have not started. AuthHub keeps security records for attribution and removes old sanitized operation snapshots through retention.

## Troubleshoot common responses

| Response | Meaning | Next action |
| --- | --- | --- |
| `AGENT_GRANT_REQUIRED` | The OAuth client is valid but has no approved grant. | Open the returned setup URL as the owner. |
| `AGENT_ACCESS_NOT_ENABLED` | Agent access is disabled or the agency is not allowlisted. | Contact AuthHub support. |
| `OPERATION_NOT_EXECUTABLE` | The operation is pending, stale, declined, expired, canceled, or already claimed. | Read the operation and prepare a new preview when required. |
| HTTP `429` or MCP `-32001` | The grant or agency rate budget is exhausted. | Wait for `Retry-After`; keep the same idempotency key. |
| `follow_up_needed` | A human must finish a provider or platform step. | Open the returned AuthHub handoff URL. |

## Current protocol limits

The current integration uses ordinary Streamable HTTP, OAuth discovery, tools, structured results, browser URLs, and polling. It does not require or support MCP Tasks, elicitation, A2A, or provider-token passthrough.

For shell-based agents and scripts, see [Use the AuthHub CLI](/developer-tools/authhub-cli).
