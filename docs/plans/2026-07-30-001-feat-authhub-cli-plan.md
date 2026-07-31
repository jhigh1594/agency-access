---
title: AuthHub CLI — Agent-Friendly Command Interface
type: feat
date: 2026-07-30
artifact_contract: ce-unified-plan/v1
artifact_readiness: implementation-ready
product_contract_source: ce-plan-bootstrap
execution: code
---

# AuthHub CLI — Agent-Friendly Command Interface

## Goal Capsule

- **Objective:** Give any AI agent a universal interface to AuthHub — a CLI that wraps the existing agent-access-operations facade, authenticates via the existing OAuth grant flow, and returns structured JSON output suitable for machine parsing.
- **Product authority:** The confirmed scope in this task governs product behavior. The existing `AgentGrant`/`AgentOperation` models, agent auth middleware, policy engine, and `agent-access-operations.service.ts` facade remain the authoritative business layer. The CLI is a transport, not a new authority.
- **Execution profile:** Standard. The CLI is a thin authenticated HTTP client — no new domain logic, no new schemas, no new database models. All business rules already exist behind the REST API and MCP tools.
- **Stop conditions:** Stop if the CLI bypasses the agent policy engine, exposes provider tokens, skips idempotency, or introduces business logic that should live in the API layer.
- **Tail ownership:** The implementer owns CLI code, auth flow, output formatting, and tests. API-layer behavior, agent policy, and domain semantics remain governed by the existing API codebase.

---

## Product Contract

### Summary

AuthHub gets a CLI (`authhub`) that any agent can execute via `exec`. The CLI authenticates using the existing agent OAuth grant, calls the existing REST API, and outputs structured JSON. No new API endpoints are required — the CLI consumes what already exists and adds coverage where the MCP tools left gaps (templates, members, webhooks, subscriptions, connections).

### Problem Frame

The existing MCP server works for MCP-compatible agents but requires StreamableHTTP, JSON-RPC, and session management. Most agent frameworks (Claude, GPT, Hermes, bash scripts) can execute a shell command. A CLI is universally consumable, zero protocol overhead, and works with any agent. The CLI also fills MCP tool gaps — template write, member read, webhook management, subscription introspection, connection revocation — by calling the REST endpoints that already support these actions.

### Actors

- A1. **Agency owner** — authorizes the CLI once via OAuth, then tells their agent to run commands.
- A2. **AI agent** — executes `authhub` commands, parses JSON output, and acts on results.
- A3. **Human operator** — uses the CLI directly for scripting or debugging.

### Requirements

- R1. The CLI authenticates via the existing agent OAuth grant flow and stores a token locally.
- R2. Every command calls the existing REST API with the stored token. No new API endpoints.
- R3. Output is structured JSON by default, with an optional `--pretty` flag for human readability.
- R4. Commands cover the full surface area an agent needs: workspace context, clients (CRUD), templates (read), access requests (prepare, read, cancel), connections (read, handoff, revoke), members (read), webhooks (read), subscriptions (read), and operations (read, execute).
- R5. The CLI wraps the existing idempotency mechanism — every mutating command requires an `--idempotency-key` argument.
- R6. Consequential commands (dispatch, cancel, revoke) return an `approvalUrl` and `operationId` in the JSON output. The agent or human must approve before execution.
- R7. Error output includes a structured `error.code`, `error.message`, and `error.retryable` field.
- R8. The CLI is a Node.js package in the `tools/` workspace, published to npm as `authhub-cli` (or scoped).
- R9. A `--json` flag (default) and `--text` flag control output format. `--text` provides one-line human-readable summaries.

### Scope Boundaries

#### Included now

- CLI binary (`authhub`) with auth, workspace, client, request, connection, member, template, webhook, subscription, and operation commands.
- Structured JSON output for agent consumption.
- Local token storage and refresh.
- Idempotency key propagation for mutating commands.
- Approval URL output for consequential actions.

#### Deferred

- Interactive prompts or TUI.
- Shell completions (bash, zsh, fish).
- Standalone installation without the monorepo.
- Output format plugins (table, YAML, CSV).
- Bulk/batch operations beyond what the API supports natively.

---

## Planning Contract

### Key Technical Decisions

- KTD1. **Node.js CLI over Go or Python.** The monorepo is Node/TypeScript. The CLI shares types from `@agency-platform/shared` and can reuse Zod validation. Node matches the team's existing tooling.
- KTD2. **Direct REST consumption, not MCP wrapping.** The CLI calls the existing REST API at `NEXT_PUBLIC_API_URL` / `AUTHHUB_API_URL`. MCP is an alternative transport for MCP-native agents; the CLI serves non-MCP agents and humans. Both paths lead to the same business logic.
- KTD3. **Use `commander` for argument parsing.** It is battle-tested, well-documented, and avoids the YAML-heavy config approach of `yargs`. The CLI has few commands and flags; `commander` is proportional.
- KTD4. **Token storage in `~/.authhub/credentials.json`.** A simple JSON file in the user's home directory. Tokens are agent OAuth access tokens with bounded TTL. No keychain complexity for V1.
- KTD5. **Fail with structured JSON exit codes.** Non-zero exit codes for errors. JSON on stdout for success, JSON on stderr for errors. Agents parse stderr on failure.
- KTD6. **No new API endpoints.** The CLI maps commands to existing REST routes. Gaps in REST coverage (e.g., no batch operations) are noted but not solved by adding new endpoints in this plan.

### Command Map

| Command | REST Endpoint | Risk Class | Permission |
|---------|--------------|------------|------------|
| `authhub login` | Clerk OAuth (browser flow) | — | — |
| `authhub workspace` | `GET /api/dashboard` + aggregations | read | `workspace:read` |
| `authhub clients list` | `GET /api/clients` | read | `clients:read` |
| `authhub clients get <id>` | `GET /api/clients/:id/detail` | read | `clients:read` |
| `authhub clients save --name X --email Y [--id Z]` | `POST/PUT /api/clients` | reversible | `clients:write` |
| `authhub clients search --email X` | `GET /api/clients/search` | read | `clients:read` |
| `authhub requests list` | `GET /api/agencies/:id/access-requests` | read | `requests:read` |
| `authhub requests get <id>` | `GET /api/access-requests/:id` | read | `requests:read` |
| `authhub requests prepare --client-id X --platforms Y --template-id Z` | Creates via `POST /api/access-requests` after approval | reversible | `requests:prepare` |
| `authhub requests cancel <id>` | `POST /api/access-requests/:id/cancel` after approval | consequential | `requests:cancel` |
| `authhub connections list` | `GET /api/connections` | read | `connections:read` |
| `authhub connections check --platforms X` | Derived from `GET /api/token-health` | read | `connections:read` |
| `authhub connections handoff --platform X` | Returns AuthHub URL | reversible | `connections:handoff` |
| `authhub connections revoke <id>` | `POST /api/connections/:id/revoke` after approval | consequential | — |
| `authhub templates list` | `GET /api/agencies/:id/templates` | read | `templates:read` |
| `authhub members list` | `GET /api/agencies/:id/members` | read | — |
| `authhub webhooks show` | `GET /api/agencies/:id/webhook-endpoint` | read | — |
| `authhub webhooks deliveries` | `GET /api/agencies/:id/webhook-deliveries` | read | — |
| `authhub subscription` | `GET /api/subscriptions/:agencyId` | read | — |
| `authhub subscription tier` | `GET /api/subscriptions/:agencyId/tier` | read | — |
| `authhub operations get <id>` | `GET /api/agent/operations/:id` | read | `operations:read` |
| `authhub operations execute <id>` | `POST /api/agent/operations/:id` (internal) | consequential | — |

### Sequencing

1. Scaffold the CLI package, add `commander`, define the auth flow, and prove a single command works end-to-end.
2. Add read commands (workspace, clients, requests, connections, templates, members, webhooks, subscription, operations).
3. Add write commands (clients save, requests prepare, connections handoff, requests cancel, connections revoke).
4. Add error handling, structured output formatting, and exit codes.
5. Add tests for auth, command parsing, output formatting, and API integration.

### System-Wide Impact

- **No API changes.** The CLI consumes existing endpoints. No new routes, no schema changes, no migrations.
- **Shared types.** The CLI imports `@agency-platform/shared` for Zod schemas and type definitions.
- **Agent auth reuse.** The CLI's `authhub login` flow produces the same OAuth token that the MCP server validates. Both transports share the `AgentGrant` model.
- **Monorepo.** The CLI lives in `tools/authhub-cli/` and joins the existing `tools/*` workspace pattern.

---

## Implementation Units

### U1. Scaffold CLI package and auth flow

- **Goal:** Create the `tools/authhub-cli/` package with bin entry, commander setup, OAuth login flow, and local token storage.
- **Requirements:** R1, R5, R8.
- **Dependencies:** None.
- **Files:** `tools/authhub-cli/package.json`; `tools/authhub-cli/tsconfig.json`; `tools/authhub-cli/bin/authhub.ts`; `tools/authhub-cli/src/index.ts`; `tools/authhub-cli/src/auth.ts`; `tools/authhub-cli/src/api-client.ts`; `tools/authhub-cli/src/config.ts`; `tools/authhub-cli/src/__tests__/auth.test.ts`; `tools/authhub-cli/src/__tests__/config.test.ts`; `pnpm-workspace.yaml`.
- **Approach:** Create a Node.js CLI package with `commander`. The `authhub login` command opens a browser for Clerk OAuth, captures the callback, exchanges for a token, and stores it in `~/.authhub/credentials.json`. The `api-client.ts` module reads the stored token and adds `Authorization: Bearer` to all API calls. The config module resolves `AUTHHUB_API_URL` from env or defaults to `http://localhost:3001`.
- **Patterns to follow:** `tools/design-os/` for workspace package structure; existing `authorizedApiFetch` pattern from `apps/web/src/lib/api/authorized-api-fetch.ts`.
- **Test scenarios:**
  1. `authhub login` opens a browser and stores a token on success.
  2. Missing or expired credentials produce a structured JSON error on stderr.
  3. `~/.authhub/credentials.json` is created with correct permissions (0600).
  4. Custom `AUTHHUB_API_URL` overrides the default.
- **Verification:** `authhub login` completes end-to-end against a local dev server; subsequent commands authenticate without re-login.

### U2. Add read commands

- **Goal:** Implement all read-only commands: workspace, clients (list, get, search), requests (list, get), connections (list, check), templates (list), members (list), webhooks (show, deliveries), subscription, and operations (get).
- **Requirements:** R2, R3, R4.
- **Dependencies:** U1.
- **Files:** `tools/authhub-cli/src/commands/workspace.ts`; `tools/authhub-cli/src/commands/clients.ts`; `tools/authhub-cli/src/commands/requests.ts`; `tools/authhub-cli/src/commands/connections.ts`; `tools/authhub-cli/src/commands/templates.ts`; `tools/authhub-cli/src/commands/members.ts`; `tools/authhub-cli/src/commands/webhooks.ts`; `tools/authhub-cli/src/commands/subscription.ts`; `tools/authhub-cli/src/commands/operations.ts`; `tools/authhub-cli/src/__tests__/commands/workspace.test.ts`; `tools/authhub-cli/src/__tests__/commands/clients.test.ts`; `tools/authhub-cli/src/__tests__/commands/requests.test.ts`.
- **Approach:** Each command module exports a commander subcommand definition. Commands call the REST API via `api-client.ts`, validate responses with Zod schemas from `@agency-platform/shared`, and output JSON to stdout. Pagination uses `--limit` and `--offset` flags (default: limit=25, offset=0).
- **Patterns to follow:** REST endpoint shapes from `apps/api/src/routes/`; response schemas from `packages/shared/src/types.ts`.
- **Test scenarios:**
  1. Each read command outputs valid JSON on stdout with the expected schema shape.
  2. `--pretty` flag formats JSON with 2-space indentation.
  3. `--text` flag outputs one-line summaries instead of JSON.
  4. API errors produce structured JSON on stderr with non-zero exit code.
  5. Pagination flags pass through to the API correctly.
- **Verification:** All read commands return valid JSON against a local dev server with seeded data.

### U3. Add write commands

- **Goal:** Implement all mutating commands: clients save, requests prepare, requests cancel, connections handoff, connections revoke. Every write command requires `--idempotency-key`.
- **Requirements:** R2, R4, R5, R6.
- **Dependencies:** U1, U2.
- **Files:** `tools/authhub-cli/src/commands/clients.ts` (add `save` and `search`); `tools/authhub-cli/src/commands/requests.ts` (add `prepare` and `cancel`); `tools/authhub-cli/src/commands/connections.ts` (add `handoff` and `revoke`); `tools/authhub-cli/src/__tests__/commands/clients.write.test.ts`; `tools/authhub-cli/src/__tests__/commands/requests.write.test.ts`; `tools/authhub-cli/src/__tests__/commands/connections.write.test.ts`.
- **Approach:** Mutating commands call the REST API and propagate the idempotency key. For consequential actions (dispatch, cancel, revoke), the command outputs `{ operationId, status, approvalUrl, expiresAt }` and exits 0 — the agent must separately approve and execute. For reversible actions (client save, connection handoff), the command executes immediately and outputs the result.
- **Patterns to follow:** Existing `agent-access-operations.service.ts` idempotency pattern; `onboarding-tools.ts` approval URL construction.
- **Test scenarios:**
  1. Missing `--idempotency-key` produces a structured error.
  2. Client save creates a new client or updates an existing one (with `--id`).
  3. Request prepare outputs `{ operationId, status: "pending_approval", approvalUrl, expiresAt }`.
  4. Connection handoff outputs a valid AuthHub URL.
  5. Retrying with the same idempotency key returns the existing operation, not a duplicate.
- **Verification:** Write commands produce correct API calls and structured output against a local dev server.

### U4. Error handling, output formatting, and polish

- **Goal:** Ensure consistent structured output, proper exit codes, rate-limit handling, and token refresh.
- **Requirements:** R3, R7.
- **Dependencies:** U1-U3.
- **Files:** `tools/authhub-cli/src/output.ts`; `tools/authhub-cli/src/errors.ts`; `tools/authhub-cli/src/__tests__/output.test.ts`; `tools/authhub-cli/src/__tests__/errors.test.ts`.
- **Approach:** Define a shared output formatter that writes JSON to stdout (success) or stderr (errors). Map HTTP status codes to exit codes (0 for 2xx, 1 for 4xx/5xx). Handle rate-limit responses (429) by surfacing `Retry-After` in the error JSON. Token refresh on 401 by re-running the auth flow.
- **Patterns to follow:** Existing API error contracts from `apps/api/src/` error envelope pattern.
- **Test scenarios:**
  1. Success writes JSON to stdout, exit code 0.
  2. API error writes JSON to stderr, exit code 1.
  3. Rate limit writes `{ error: { code: "RATE_LIMITED", retryAfterSeconds: N } }` to stderr.
  4. Network timeout writes `{ error: { code: "TIMEOUT", retryable: true } }` to stderr.
  5. `--text` flag produces human-readable one-liners for success and error cases.
- **Verification:** Error cases produce parseable structured output across all commands.

---

## Verification Contract

| Gate | Scope | Done signal |
|---|---|---|
| CLI build | `npm run build --workspace=tools/authhub-cli` | Package compiles and produces bin entry |
| CLI tests | `npm run test --workspace=tools/authhub-cli` | Auth, command parsing, output, and integration tests pass |
| Full regression | `npm run test` and `npm run typecheck` from repo root | No existing test or typecheck breaks |
| Integration smoke | `authhub workspace` and `authhub clients list` against local dev server | Valid JSON output with correct schema |

---

## Definition of Done

- An agent can run `authhub login` once, then execute all read and write commands without re-authenticating.
- All output is structured JSON parseable by any agent framework.
- Consequential actions require explicit approval via a returned URL.
- No new API endpoints, schemas, or database changes were introduced.
- The CLI lives in `tools/authhub-cli/` and is part of the existing monorepo workspace.
