# Claude Code Cleanup - Recommended Removals

**Generated:** February 8, 2026
**Backup Created:** `.claude-backup-20260208-152850.tar.gz` (381KB)

---

## EXECUTIVE SUMMARY

This document lists all plugins, skills, commands, and agents recommended for removal to reduce complexity and eliminate duplicates. **Total items to remove: 32** (reducing setup by ~35%).

**Excluded from removal (per user request):**
- price-intel
- vercel-react-best-practices
- supabase-postgres-best-practices
- growth-embedded
- brainstorm
- design-first-dev
- principal-ui-ux-designer
- competitive-landscape
- competitive-analysis
- compete
- strategy-frameworks
- copywriting
- next-best-practices

---

## PART 1: PLUGIN REMOVALS (settings.json)

### File to Edit: `.claude/settings.json`

**Remove these lines from `enabledPlugins`:**

```json
"pr-review-toolkit@claude-plugins-official": true,
```

**Reason:** Duplicate of `coderabbit@claude-plugins-official` - both handle PR/code review. Coderabbit is more comprehensive.

---

## PART 2: SKILL REMOVALS (.claude/skills/)

### Skills to Completely Remove (directories)

```bash
cd /Users/jhigh/agency-access-platform/.claude/skills/

# Code Review Duplicates (covered by coderabbit plugin)
rm -rf code-review-excellence

# Testing Duplicates
rm -rf webapp-testing

# Competitive Analysis Duplicates (covered by competitive-research agent)
# Note: competitive-landscape and competitive-analysis kept per user request
# No removals in this category

# Strategy Duplicates (covered by strategic-thinking + plan@dotai)
# Note: strategy-frameworks kept per user request
rm -rf strategic-build
rm -rf strategic-pm

# Frontend/UI Duplicates (covered by frontend-design + figma plugin)
# Note: design-first-dev and principal-ui-ux-designer kept per user request
# No removals in this category

# Writing/Communication Duplicates
# Note: copywriting kept per user request
rm -rf confident-speaking

# Analytics/Metrics Duplicates
rm -rf analytics-tracking

# Low-Frequency / Personal Development (not core to dev workflow)
rm -rf career-growth
rm -rf workplace-navigation
rm -rf influence-craft
rm -rf stakeholder-craft
rm -rf culture-craft

# Specialized Low-Frequency Skills
rm -rf launch-execution
rm -rf jtbd-building
rm -rf user-feedback-system

# Very Specific/Tech Stack Specific (already covered elsewhere)
# Note: supabase-postgres-best-practices and vercel-react-best-practices kept per user request
rm -rf secrets-management
```

### Summary: 16 Skills to Remove

| Skill | Reason to Remove | Replacement |
|-------|------------------|-------------|
| `code-review-excellence` | Duplicate of coderabbit plugin | `coderabbit@claude-plugins-official` |
| `webapp-testing` | Duplicate of test-driven-development | `test-driven-development` skill |
| `strategic-build` | Duplicate of strategic-thinking | `strategic-thinking` skill |
| `strategic-pm` | Duplicate of strategic-thinking | `strategic-thinking` skill |
| `confident-speaking` | Duplicate of exec-comms | `exec-comms` skill |
| `analytics-tracking` | Duplicate of metrics-frameworks | `metrics-frameworks` skill |
| `career-growth` | Personal dev, not product dev | N/A (not core workflow) |
| `workplace-navigation` | Soft skills, not technical | N/A (not core workflow) |
| `influence-craft` | Soft skills, not technical | N/A (not core workflow) |
| `stakeholder-craft` | Soft skills, not technical | N/A (not core workflow) |
| `culture-craft` | Team building, not daily dev | N/A (not core workflow) |
| `launch-execution` | Low frequency use | Use when needed, not core |
| `jtbd-building` | Low frequency use | Use when needed, not core |
| `user-feedback-system` | Low frequency use | Use when needed, not core |
| `secrets-management` | Very specific | N/A (niche use case) |

---

## PART 3: COMMAND REMOVALS (.claude/commands/)

### Commands to Remove

```bash
cd /Users/jhigh/agency-access-platform/.claude/commands/

# Writing/Communication Duplicate (covered by exec-comms, strategic-storytelling)
rm write.md

# Metrics Duplicate (covered by metrics-frameworks skill)
rm measure.md

# Note: brainstorm.md and compete.md kept per user request
```

### Summary: 2 Commands to Remove

| Command | Reason to Remove | Replacement |
|---------|------------------|-------------|
| `write` | Duplicate of exec-comms/strategic-storytelling | `exec-comms` skill, `strategic-storytelling` skill |
| `measure` | Duplicate of metrics-frameworks | `metrics-frameworks` skill |

---

## PART 4: AGENT REVIEW

### Agents: KEEP BOTH

| Agent | Reason |
|-------|--------|
| `competitive-research` | Core competitive intelligence, unique value |
| `pm-copilot` | Planview-specific PM work (note: may be irrelevant if not working on Planview products) |

**Note:** `pm-copilot` agent is specifically designed for Planview products (AgilePlace, OKRs, Roadmaps, Visualization). If you are NOT working on Planview products, this agent can also be removed:
```bash
rm /Users/jhigh/agency-access-platform/.claude/agents/pm-copilot.md
```

---

## PART 5: EXECUTION SCRIPT

### Automated Removal Script

Save this as `cleanup-claude.sh` and run with `bash cleanup-claude.sh`:

```bash
#!/bin/bash

# Claude Code Cleanup Script
# Generated: February 8, 2026
# Backup: .claude-backup-20260208-152850.tar.gz

set -e

echo "🧹 Starting Claude Code cleanup..."
echo ""

# Variables
CLAUDE_DIR="/Users/jhigh/agency-access-platform/.claude"
SKILLS_DIR="$CLAUDE_DIR/skills"
COMMANDS_DIR="$CLAUDE_DIR/commands"
AGENTS_DIR="$CLAUDE_DIR/agents"

# Count before
SKILLS_BEFORE=$(ls -1 "$SKILLS_DIR" | grep -v "^\." | wc -l)
COMMANDS_BEFORE=$(ls -1 "$COMMANDS_DIR" | grep -v "^\." | wc -l)

echo "📊 Before cleanup:"
echo "  Skills: $SKILLS_BEFORE"
echo "  Commands: $COMMANDS_BEFORE"
echo ""

# Step 1: Remove skills
echo "🗑️  Removing skills..."
cd "$SKILLS_DIR"

rm -rf code-review-excellence
rm -rf webapp-testing
rm -rf strategic-build
rm -rf strategic-pm
rm -rf confident-speaking
rm -rf analytics-tracking
rm -rf career-growth
rm -rf workplace-navigation
rm -rf influence-craft
rm -rf stakeholder-craft
rm -rf culture-craft
rm -rf launch-execution
rm -rf jtbd-building
rm -rf user-feedback-system
rm -rf secrets-management

echo "  ✅ Removed 15 skills"

# Step 2: Remove commands
echo "🗑️  Removing commands..."
cd "$COMMANDS_DIR"

rm write.md
rm measure.md

echo "  ✅ Removed 2 commands"

# Step 3: Update settings.json (manual step required)
echo ""
echo "⚠️  MANUAL STEP REQUIRED:"
echo "  Edit .claude/settings.json and remove this line:"
echo '    "pr-review-toolkit@claude-plugins-official": true,'
echo ""

# Count after
SKILLS_AFTER=$(ls -1 "$SKILLS_DIR" | grep -v "^\." | wc -l)
COMMANDS_AFTER=$(ls -1 "$COMMANDS_DIR" | grep -v "^\." | wc -l)

echo "📊 After cleanup:"
echo "  Skills: $SKILLS_AFTER (removed $((SKILLS_BEFORE - SKILLS_AFTER)))"
echo "  Commands: $COMMANDS_AFTER (removed $((COMMANDS_BEFORE - COMMANDS_AFTER)))"
echo ""
echo "✨ Cleanup complete!"
echo ""
echo "🔄 To restore from backup:"
echo "  tar -xzf .claude-backup-20260208-152850.tar.gz"
```

---

## PART 6: MANUAL REMOVAL INSTRUCTIONS

If you prefer manual removal instead of the script:

### Step 1: Edit `.claude/settings.json`

Find and remove this line:
```json
"pr-review-toolkit@claude-plugins-official": true,
```

### Step 2: Remove Skills (15 total)

From `.claude/skills/`, delete these directories:
1. `code-review-excellence/`
2. `webapp-testing/`
3. `strategic-build/`
4. `strategic-pm/`
5. `confident-speaking/`
6. `analytics-tracking/`
7. `career-growth/`
8. `workplace-navigation/`
9. `influence-craft/`
10. `influence-craft/`
11. `stakeholder-craft/`
12. `culture-craft/`
13. `launch-execution/`
14. `jtbd-building/`
15. `user-feedback-system/`
16. `secrets-management/`

### Step 3: Remove Commands (2 total)

From `.claude/commands/`, delete these files:
1. `write.md`
2. `measure.md`

---

## PART 7: VERIFICATION CHECKLIST

After cleanup, verify:

- [ ] Settings.json no longer references `pr-review-toolkit`
- [ ] Skills directories removed (16 items)
- [ ] Commands files removed (2 items)
- [ ] Claude Code still launches correctly
- [ ] Core functionality works (run a test task)

---

## PART 8: ROLLBACK

If anything breaks, restore from backup:

```bash
# Navigate to project root
cd /Users/jhigh/agency-access-platform

# Remove current .claude directory
rm -rf .claude/

# Restore from backup
tar -xzf .claude-backup-20260208-152850.tar.gz
```

---

## FINAL SUMMARY

| Category | Before | After | Removed |
|----------|--------|-------|---------|
| Enabled Plugins | 17 | 16 | 1 |
| Skills | 60+ | ~45 | 16 |
| Commands | 27 | 25 | 2 |
| **Total** | **100+** | **~86** | **19** |

**Complexity Reduction:** ~19% reduction while preserving all unique functionality.

---

*This document preserves the following per your request: price-intel, vercel-react-best-practices, supabase-postgres-best-practices, growth-embedded, brainstorm, design-first-dev, principal-ui-ux-designer, competitive-landscape, competitive-analysis, compete, strategy-frameworks, copywriting, next-best-practices.*
