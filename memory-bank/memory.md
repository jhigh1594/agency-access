# Agency Access Platform - Memory Bank

*Last Updated: February 7, 2026*
*Purpose: AI context persistence for Agency Access Platform workspace*

---

## Current Focus

**Project**: Agency Access Platform - A centralized platform for managing agency access and permissions.

**Status**: Initial development phase

---

## Workspace Context

This workspace contains the Agency Access Platform - a system for managing agency access, permissions, and client onboarding.

---

## Technical Notes

### Tech Stack
- Next.js for frontend
- TypeScript
- Authentication and authorization system

### Key Integration Points
- Agency client systems
- Permission management
- Access control workflows

### AI / agent setup
- **Claude Code**: Official plugins (LSP, github, vercel, supabase, sentry, etc.) and dotai in `.claude/settings.json`. Skills live only in `.claude/skills/` (Cursor reads from here).
- **Cursor**: Project rules in `.cursor/rules/` (TypeScript, React/Next.js, Fastify API, security, TDD, UI/UX). No duplicate skills dir.

---

## Active Decisions

**Strategic Questions**:
- What are the core permission models for agencies?
- How do we handle multi-tenancy?

**Open Questions**:
- TBD

---

*This memory file will be updated as the project evolves.*
