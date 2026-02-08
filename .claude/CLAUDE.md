# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is the **Agency Access Platform** - a centralized platform for managing agency access, permissions, and client onboarding. The workspace uses AIPMOS (AI Product Management Operating System) for AI-assisted development and knowledge management.

## Primary Use Cases

1. **Product Development** - Building and maintaining the Agency Access Platform
2. **AI-Assisted Development** - Using AI coding assistants for development tasks
3. **Knowledge Management** - Maintaining product context, frameworks, and best practices
4. **Documentation** - PRDs, technical specs, and API documentation

## Directory Structure & Key Areas

### Core Application
- **`/apps/`** - Main application code
- **`/packages/`** - Shared packages and libraries
- **`/docs/`** - Product documentation and technical specs

### AI Workspace (.claude/)
- **`.claude/commands/`** - AI workflow commands (align, brainstorm, compete, discover, prioritize, etc.)
- **`.claude/skills/`** - Reusable AI skills for various PM and development tasks
- **`.claude/rules/`** - PM frameworks and mental models
- **`.claude/scripts/`** - Session hooks and automation scripts

### Memory System
- **`/memory-bank/memory.md`** - Single unified memory file for AI context
- **`.aipmos/`** - AIPMOS configuration and session tracking

### Automation Scripts
- **`/scripts/automation/`** - Python automation for memory maintenance and session tracking
  - `observers/` - Event observers for pattern detection
  - `shared/` - Shared utilities

## AIPMOS Integration

This workspace uses AIPMOS (AI Product Management Operating System) for:

1. **Session Tracking** - Automatic session start/end recording
2. **Pattern Detection** - Learning from your work patterns
3. **Memory Maintenance** - Auto-updating memory.md with recent commits
4. **Context Loading** - Loading relevant context at session start

### Session Hooks
- **SessionStart**: Loads skills, memory.md, and learned patterns
- **SessionEnd**: Records session end, updates memory.md, runs maintenance

### Commands Available
- `/align` - Stakeholder alignment assistant
- `/brainstorm` - Persona-based tactical brainstorming
- `/compete` - Competitive intelligence
- `/decide` - Decision-making assistant
- `/discover` - Product discovery workflow
- `/prioritize` - Prioritization framework
- `/research` - Product research
- `/spec` - PRD writer
- `/think` - Strategic thinking partner
- And many more (see `.claude/commands/`)

## Best Practices

### Git Workflow - Frequent Checkpoint Commits
- **Commit frequently**: After each file change or small logical unit
- **Keep commits atomic**: One file or feature per commit = easy reverts
- **Standard pattern**: `git add path/to/file && git commit -m "description"`
- **Why**: Small commits give you granular revert points instead of "undo everything"

### Code Development
- Follow TypeScript strict mode conventions
- Use existing patterns and conventions from the codebase
- Test changes before committing
- Document significant decisions in memory-bank/

### Using AI Commands
1. Use `/brainstorm` for tactical feature exploration
2. Use `/spec` to create PRDs from brainstormed requirements
3. Use `/prioritize` for backlog prioritization
4. Use `/think` for strategic product decisions

## Notes for AI Assistants

- **Context Priority**: Reference memory-bank/memory.md for current project context
- **Use Skills**: Check `.claude/skills/` for relevant skills before any task
- **Pattern Recognition**: AIPMOS learns from your work patterns over time
- **Memory Updates**: Memory.md is auto-updated based on git commits

---

**Last Updated**: February 7, 2026
**AIPMOS Version**: 1.0.0
