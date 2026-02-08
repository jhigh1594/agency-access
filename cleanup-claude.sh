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
SKILLS_BEFORE=$(ls -1 "$SKILLS_DIR" 2>/dev/null | grep -v "^\." | grep -v "\.md$" | wc -l | tr -d ' ')
COMMANDS_BEFORE=$(ls -1 "$COMMANDS_DIR" 2>/dev/null | grep -v "^\." | grep -v "\.md$" | wc -l | tr -d ' ')

echo "📊 Before cleanup:"
echo "  Skills: $SKILLS_BEFORE"
echo "  Commands: $COMMANDS_BEFORE"
echo ""

# Step 1: Remove skills
echo "🗑️  Removing skills..."
cd "$SKILLS_DIR" 2>/dev/null || { echo "❌ Skills directory not found"; exit 1; }

[ -d "code-review-excellence" ] && rm -rf code-review-excellence && echo "  ✅ Removed code-review-excellence"
[ -d "webapp-testing" ] && rm -rf webapp-testing && echo "  ✅ Removed webapp-testing"
[ -d "strategic-build" ] && rm -rf strategic-build && echo "  ✅ Removed strategic-build"
[ -d "strategic-pm" ] && rm -rf strategic-pm && echo "  ✅ Removed strategic-pm"
[ -d "confident-speaking" ] && rm -rf confident-speaking && echo "  ✅ Removed confident-speaking"
[ -d "analytics-tracking" ] && rm -rf analytics-tracking && echo "  ✅ Removed analytics-tracking"
[ -d "career-growth" ] && rm -rf career-growth && echo "  ✅ Removed career-growth"
[ -d "workplace-navigation" ] && rm -rf workplace-navigation && echo "  ✅ Removed workplace-navigation"
[ -d "influence-craft" ] && rm -rf influence-craft && echo "  ✅ Removed influence-craft"
[ -d "stakeholder-craft" ] && rm -rf stakeholder-craft && echo "  ✅ Removed stakeholder-craft"
[ -d "culture-craft" ] && rm -rf culture-craft && echo "  ✅ Removed culture-craft"
[ -d "launch-execution" ] && rm -rf launch-execution && echo "  ✅ Removed launch-execution"
[ -d "jtbd-building" ] && rm -rf jtbd-building && echo "  ✅ Removed jtbd-building"
[ -d "user-feedback-system" ] && rm -rf user-feedback-system && echo "  ✅ Removed user-feedback-system"
[ -d "secrets-management" ] && rm -rf secrets-management && echo "  ✅ Removed secrets-management"

# Step 2: Remove commands
echo ""
echo "🗑️  Removing commands..."
cd "$COMMANDS_DIR" 2>/dev/null || { echo "❌ Commands directory not found"; exit 1; }

[ -f "write.md" ] && rm write.md && echo "  ✅ Removed write.md"
[ -f "measure.md" ] && rm measure.md && echo "  ✅ Removed measure.md"

# Step 3: Update settings.json (manual step required)
echo ""
echo "⚠️  MANUAL STEP REQUIRED:"
echo "  Edit .claude/settings.json and remove this line:"
echo '    "pr-review-toolkit@claude-plugins-official": true,'
echo ""
echo "  You can run this command to do it automatically:"
echo '  sed -i '' "/pr-review-toolkit/d" .claude/settings.json'
echo ""

# Count after
SKILLS_AFTER=$(ls -1 "$SKILLS_DIR" 2>/dev/null | grep -v "^\." | grep -v "\.md$" | wc -l | tr -d ' ')
COMMANDS_AFTER=$(ls -1 "$COMMANDS_DIR" 2>/dev/null | grep -v "^\." | grep -v "\.md$" | wc -l | tr -d ' ')

echo "📊 After cleanup:"
echo "  Skills: $SKILLS_AFTER (removed $((SKILLS_BEFORE - SKILLS_AFTER)))"
echo "  Commands: $COMMANDS_AFTER (removed $((COMMANDS_BEFORE - COMMANDS_AFTER)))"
echo ""
echo "✨ Cleanup complete!"
echo ""
echo "🔄 To restore from backup:"
echo "  cd /Users/jhigh/agency-access-platform"
echo "  rm -rf .claude/"
echo "  tar -xzf .claude-backup-20260208-152850.tar.gz"
