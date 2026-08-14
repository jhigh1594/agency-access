---
title: Use the AuthHub CLI
description: Build and use the private AuthHub CLI for agent-friendly JSON access to workspace, client, request, connection, and operation data.

sidebar_position: 2
keywords:
  - AuthHub CLI
  - authhub command line
  - agent CLI
  - JSON CLI
  - AuthHub scripts
tags:
  - cli
  - agents
  - automation
---

# Use the AuthHub CLI

The `authhub` CLI is a Node.js command interface for agents, shell scripts, and operators. It calls the existing AuthHub REST API and returns machine-readable JSON by default.

The CLI is currently a private monorepo tool. It is not published as a standalone npm package.

## Before you start

- Node.js 20 or newer.
- A local checkout of the AuthHub repository.
- An AuthHub API environment.
- An agent access token issued for the API you will use.

## Build the CLI

From the repository root:

```bash
npm install
npm run build --workspace=tools/authhub-cli
```

The compiled binary is `tools/authhub-cli/dist/bin/authhub.js`. Set `AUTHHUB_API_URL` when using a non-local API. Without it, the CLI uses `http://localhost:3001`.

For the examples below, set a short shell variable:

```bash
export AUTHHUB_CLI="node tools/authhub-cli/dist/bin/authhub.js"
export AUTHHUB_API_URL="https://<api-host>"
```

## Authenticate once

Run:

```bash
$AUTHHUB_CLI login --api-url "$AUTHHUB_API_URL"
```

When prompted, paste the agent access token. You can also pass an existing token through an environment variable:

```bash
export AUTHHUB_AGENT_TOKEN="<agent-access-token>"
$AUTHHUB_CLI login --api-url "$AUTHHUB_API_URL" --token "$AUTHHUB_AGENT_TOKEN"
```

The CLI validates the token with the API, stores the credentials in `~/.authhub/credentials.json`, and sets the file mode to `0600`. Do not commit, upload, or paste that file into an agent prompt.

Check or clear the saved credentials with:

```bash
$AUTHHUB_CLI whoami
$AUTHHUB_CLI logout
```

## Read workspace data

Successful commands write JSON to standard output. Add `--pretty` when a human needs formatted output.

```bash
$AUTHHUB_CLI workspace --pretty
$AUTHHUB_CLI clients list --limit 25 --pretty
$AUTHHUB_CLI clients get <client-id> --pretty
$AUTHHUB_CLI clients search --email "owner@example.com"
$AUTHHUB_CLI requests list --status pending --pretty
$AUTHHUB_CLI requests get <request-id> --pretty
$AUTHHUB_CLI connections list --pretty
$AUTHHUB_CLI connections check --platforms google_ads,meta_ads --pretty
$AUTHHUB_CLI templates --pretty
$AUTHHUB_CLI members --pretty
$AUTHHUB_CLI webhooks show --pretty
$AUTHHUB_CLI webhooks deliveries --limit 25 --pretty
$AUTHHUB_CLI subscription show --pretty
$AUTHHUB_CLI subscription tier
```

The CLI derives the agency from the authenticated credentials. Do not add an agency ID from an untrusted prompt or script input.

## Create or prepare changes

Mutating client and request commands require an idempotency key. Use a stable key when retrying the same action; use a new key for a new intent.

```bash
$AUTHHUB_CLI clients create \
  --name "Jane Owner" \
  --email "owner@example.com" \
  --company "Example Co" \
  --idempotency-key "client-create-example-co-1"

$AUTHHUB_CLI clients update \
  --id <client-id> \
  --company "Example Co, Inc." \
  --idempotency-key "client-update-example-co-1"

$AUTHHUB_CLI requests prepare \
  --client-id <client-id> \
  --platforms google_ads,meta_ads \
  --idempotency-key "request-prepare-example-co-1" \
  --pretty

$AUTHHUB_CLI connections handoff \
  --platform google_ads \
  --idempotency-key "connection-handoff-google-1" \
  --pretty
```

Request preparation and connection handoff return an AuthHub URL when a human must finish the work. The CLI does not accept provider passwords or provider OAuth tokens.

## Read and execute approved operations

Consequential operations must be approved by the owner before execution:

```bash
$AUTHHUB_CLI operations get <operation-id> --pretty
$AUTHHUB_CLI operations execute <operation-id> --pretty
```

You can also prepare or cancel a request and revoke a connection. These commands require `--idempotency-key` and follow the API's approval and authorization rules:

```bash
$AUTHHUB_CLI requests cancel <request-id> --idempotency-key "request-cancel-<request-id>-1"
$AUTHHUB_CLI connections revoke <connection-id> --idempotency-key "connection-revoke-<connection-id>-1"
```

Do not treat a returned operation ID as proof that an external effect happened. Read the operation status and confirm owner approval first.

## Handle errors in scripts

Errors are written as structured JSON to standard error and the command exits with a non-zero status. The error object includes `code`, `message`, `status`, and `retryable` fields when available.

```bash
if ! result="$($AUTHHUB_CLI workspace 2>error.json)"; then
  jq '.error' error.json
  exit 1
fi
printf '%s\n' "$result" | jq '.data // .'
```

Do not retry a failed mutating command with a different idempotency key unless you intend to create a new operation.

## Current limits

The current CLI does not provide a standalone npm install, shell completions, interactive TUI, batch commands, YAML or CSV output, or a separate business-logic layer. Use the [agent connection guide](/agentic-workflows/connect-an-agent) for MCP clients.
