---
type: project
title: AuthHub
slug: projects/side/authhub
tags: [authhub, oauth, agency-access, saas, b2b]
status: active
phase: built / distribution
url: https://authhub.co
updated: 2026-07-27
---

# AuthHub (agency-access)

OAuth aggregation platform for marketing agencies. Solves the "client credential handoff" problem — agencies need OAuth tokens from clients without the friction of manual credential sharing.

## Current Phase: Built → Distribution
Product is built and live. Problem is distribution, not product. Zero users.

## Stack
- Monorepo: `apps/web` (port 3000), `apps/api` (port 3001), `packages/shared`
- Prisma Studio: port 5555
- Auth: NEVER store OAuth tokens in PostgreSQL — use Infisical, store only `secretId` in DB
- TDD: Write failing tests before implementation

## Architecture Decisions
- Infisical for secret storage (not Postgres) — non-negotiable
- OAuth aggregation as core primitive
- Agency + client model (not end-user consumer)

## Current Status
- Live at authhub.co
- Zero users
- Build phase complete
- Distribution is the entire unsolved problem

## Blocking Questions
- Which channel gives credible access to 5 agency buyers?
- Cold outreach, community (agency Slacks/Discords), or inbound content?
- Is the ICP "marketing agencies" or more specific (e.g., paid media agencies, social agencies)?

---

<!-- Agents: update status when user #1 onboards. Add dated entries below for distribution experiments, ICP learnings, and any architecture decisions. -->
