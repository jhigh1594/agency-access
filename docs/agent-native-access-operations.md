# Agent-native access operations

AuthHub exposes an allowlisted remote MCP endpoint so an agency owner's personal agent can inspect setup, prepare onboarding, request approval, monitor fulfillment, and propose recovery without receiving provider credentials.

## Connect an agent

1. In **Settings → Agents**, copy the MCP endpoint (`https://<api-host>/mcp`) into a Streamable HTTP MCP client.
2. The client discovers `/.well-known/oauth-protected-resource/mcp` and completes delegated sign-in through Clerk.
3. The first authenticated call from an unapproved OAuth client returns `AGENT_GRANT_REQUIRED` with an AuthHub setup URL.
4. Open that URL in a browser, review the conservative permission profile, and connect the agent.
5. Retry the MCP call. AuthHub reloads the agency-scoped grant on every request.

The first release requires ordinary Streamable HTTP, OAuth protected-resource discovery, tools, structured results, browser URLs, and polling. It does not require MCP Tasks, elicitation, or A2A.

## Permissions and human control

- Read permissions cover workspace, client, template, connection, request, operation, and activity state.
- Reversible writes, such as client/profile changes, are idempotent and audited.
- Dispatching or canceling access is consequential. The agent receives an operation ID and approval URL; no access request or email is created before owner approval.
- Provider OAuth consent, passwords, CAPTCHAs, terms acceptance, and client authorization are human-only. Tools return an authenticated AuthHub handoff URL.
- Approval URLs locate an operation but grant no authority. The approval page requires the owner's normal session and derives the agency server-side.

Revoking a grant blocks its next call and cancels prepared, pending, or approved operations that have not begun execution. Security records remain for attribution; old payload snapshots are sanitized by the retention job.

Owners can rename an active grant and change its capability set from **Settings → Agents**. The initial connection profile is intentionally conservative; enable `clients:write`, `agency:write`, or `requests:cancel` only when the agent's assigned workflow requires them. Dispatch and cancellation still require a separate operation approval even when the grant includes those permissions.

## Durable operation states

`prepared → pending_approval → approved → executing → succeeded`

Terminal alternatives are `declined`, `expired`, `canceled`, and `failed_terminal`. `failed_retryable` may be claimed again with the same operation and idempotency key. Reusing a key with different sanitized intent returns `IDEMPOTENCY_CONFLICT`.

Client invitation delivery uses an operation-stable provider idempotency key. If delivery fails after request creation, retry finds the request by `agent-operation:<operation-id>` and retries only the unsatisfied email effect.

## Troubleshooting

| Signal | Meaning | Next action |
|---|---|---|
| `AGENT_GRANT_REQUIRED` | OAuth identity is valid, but this client has no approved grant | Open the returned setup URL as the owner |
| `AGENT_ACCESS_NOT_ENABLED` | Agency is not on the rollout allowlist, or the feature is disabled | Contact the AuthHub operator |
| `OPERATION_NOT_EXECUTABLE` | Approval is pending, stale, declined, expired, canceled, or already claimed | Poll the operation; prepare a new preview when instructed |
| HTTP 429 / `-32001` | Per-grant or aggregate agency budget is exhausted | Wait for `Retry-After`; do not change the idempotency key |
| `follow_up_needed` | OAuth occurred but required assets or human steps remain unresolved | Follow the returned remediation or handoff URL |

## Production rollout and rollback

### Required configuration

- `AGENT_NATIVE_ENABLED=false` for the migration-first deploy
- `AGENT_NATIVE_AGENCY_ALLOWLIST=<agency UUIDs>` before enablement
- `AGENT_MCP_RESOURCE_URL=https://<api-host>/mcp`
- `CLERK_OAUTH_ISSUER=<canonical Clerk issuer>`
- `CLERK_OAUTH_VERIFY_URL=https://api.clerk.com/v1/oauth_applications/access_tokens/verify`
- Separate read, mutation, and aggregate agency rate budgets

### Staging sequence

1. Record counts for agencies, clients, access requests, audit logs, grants, and operations.
2. Deploy the API with the feature disabled. Startup applies the additive migration and runs the agent schema-readiness check only when enablement is requested.
3. Verify existing browser sign-in, access-request creation, invite loading, OAuth callback, webhook delivery, and health checks.
4. Validate Clerk token claims in staging: issuer, exact MCP resource/audience, owner subject, organization, OAuth client, expiry, local grant revocation, and authorization-server revocation.
5. Add one design-partner agency to the allowlist, enable the feature, and complete connect → readiness → prepare → approve → dispatch → partial/completed monitoring → revoke.
6. Repeat the compatibility smoke with two current MCP hosts. Record host/version/date and whether optional capabilities were disabled.

Do not mark interoperability complete until two real hosts and a staging Clerk instance pass. Automated in-memory and HTTP protocol tests are necessary but are not substitutes for this gate.

### Two-host compatibility record

Complete one row per current host against the same staging deployment. A row passes only when every required behavior is observed without MCP Tasks, elicitation, or server-initiated notifications.

| Host and version | Test date | Protected-resource discovery | Clerk OAuth | Granted tool list | Structured read | Approval URL | Poll and execute | Revocation blocks next call | Result |
|---|---|---|---|---|---|---|---|---|---|
|  |  |  |  |  |  |  |  |  |  |
|  |  |  |  |  |  |  |  |  |  |

For each failure, record the correlation ID, HTTP/MCP error, host behavior, and whether the failure reproduces with optional host capabilities disabled. Never paste bearer tokens or provider credentials into this record.

### Data invariants

Run read-only checks after migration and after enablement:

```sql
SELECT COUNT(*) FROM agencies;
SELECT COUNT(*) FROM access_requests;
SELECT COUNT(*) FROM audit_logs;
SELECT grant_id, idempotency_key, COUNT(*) FROM agent_operations GROUP BY 1, 2 HAVING COUNT(*) > 1;
SELECT COUNT(*) FROM agent_operations o LEFT JOIN agent_grants g ON g.id = o.grant_id WHERE g.id IS NULL;
SELECT COUNT(*) FROM agent_operations WHERE status IN ('declined','expired','canceled') AND execution_started_at IS NOT NULL;
```

Existing domain counts must be unchanged by migration. The final three queries must return no duplicate/orphan/ineligible-execution rows.

### Disable and rollback

Set `AGENT_NATIVE_ENABLED=false` to remove the MCP route immediately. Keep the human grant and operation records readable so owners can inspect and revoke them. Existing browser, REST, invite, OAuth, webhook, billing, and quota flows remain registered. Roll back application code if needed, but retain the additive tables and audit columns until a separately reviewed cleanup migration; do not use `db push` or drop security records during incident response.

## Design-partner metrics

Track time to first authenticated tool call, full-loop completion, calls by risk class/outcome, approval coverage and latency, duplicate suppression, downstream failures, rate limits, revocations, and redaction violations. Telemetry dimensions contain IDs, tool class, outcome, correlation ID, and latency only—never tool arguments, provider tokens, client email, or secret identifiers.

Internal operators can inspect the current process counters at `GET /api/internal-admin/agent-metrics`; the route uses the existing internal-admin allowlist. Structured events (`agent_authorization_failure`, `agent_tool_call`, `agent_approval_decision`, `agent_duplicate_suppressed`, `agent_connected`, `agent_grant_revoked`, and `agent_redaction_violation`) remain the durable deployment-level source for dashboards and design-partner analysis. Authorization failures use bounded reason codes and never log bearer material. Record the moment the endpoint is handed to each partner in the enrollment worksheet; compare it with the first successful `agent_tool_call` event to calculate connection time. Mark full-loop completion only after F1-F4 are evidenced in the partner run log, rather than inferring it from OAuth or dispatch success alone.

### Design-partner run log

Complete one row for each of at least three allowlisted agencies. Attach audit/operation identifiers or correlation IDs as evidence; do not record client email, provider tokens, secret identifiers, or raw intake responses.

| Partner agency ID | Endpoint shared at | First authenticated call | Minutes to first call | F1 connect and revoke | F2 readiness and handoff | F3 prepare, approve, dispatch once | F4 truthful monitor and recovery | Main-dashboard steps excluding approvals/human OAuth | Operator repair required | Result |
|---|---|---|---|---|---|---|---|---:|---|---|
|  |  |  |  |  |  |  |  |  |  |  |
|  |  |  |  |  |  |  |  |  |  |  |
|  |  |  |  |  |  |  |  |  |  |  |

Before ending the design-partner period, reconcile the run log with operator telemetry: consequential operations versus approval decisions, average approval latency, duplicate suppression, downstream failures, rate limits, revocations, and redaction violations. The launch targets remain zero duplicate external effects, zero prohibited-secret findings, 100% approval/audit coverage for consequential actions, and at least 90% of agent-driven onboarding steps completed outside the main dashboard.
