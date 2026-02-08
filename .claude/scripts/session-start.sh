#!/bin/bash
# SessionStart hook - loads skills and memory context

set -euo pipefail

# Embedded using-skills content
using_skills_content='---
name: using-skills
description: Use when starting any conversation - establishes mandatory workflows for finding and using skills
---

<EXTREMELY-IMPORTANT>
If you think there is even a 1% chance a skill might apply to what you are doing, you ABSOLUTELY MUST read the skill.

IF A SKILL APPLIES TO YOUR TASK, YOU DO NOT HAVE A CHOICE. YOU MUST USE IT.
</EXTREMELY-IMPORTANT>

## MANDATORY FIRST RESPONSE PROTOCOL

Before responding to ANY user message, you MUST complete this checklist:

1. ☐ List available skills in your mind
2. ☐ Ask yourself: "Does ANY skill match this request?"
3. ☐ If yes → Use the Skill tool to read and run the skill file
4. ☐ Announce which skill you'\''re using
5. ☐ Follow the skill exactly

**Responding WITHOUT completing this checklist = automatic failure.**

## Critical Rules

1. **Follow mandatory workflows.** Check for relevant skills before ANY task.
2. Execute skills with the Skill tool

## Skills with Checklists

If a skill has a checklist, YOU MUST create TodoWrite todos for EACH item.

**Don'\''t:**
- Work through checklist mentally
- Skip creating todos "to save time"
- Batch multiple items into one todo

**Why:** Checklists without TodoWrite tracking = steps get skipped. Every time.

## Summary

**Starting any task:**
1. If relevant skill exists → Use the skill
2. Announce you'\''re using it
3. Follow what it says

**Finding a relevant skill = mandatory to read and use it. Not optional.**
'

# Escape output for JSON
using_skills_escaped=$(echo "$using_skills_content" | sed 's/\\/\\\\/g' | sed 's/"/\\"/g' | awk '{printf "%s\\n", $0}')

# Load memory.md if it exists
memory_context=""
memory_escaped=""

# Discover workspace root by walking up from current directory
workspace_root=$(pwd)
while [ "$workspace_root" != "/" ] && [ ! -d "$workspace_root/.aipmos" ]; do
    workspace_root=$(dirname "$workspace_root")
done

# Try to load memory.md
memory_file="$workspace_root/memory-bank/memory.md"
if [ -f "$memory_file" ]; then
    memory_context=$(cat "$memory_file")
fi

# Try to load learned patterns if they exist
learned_patterns_file="$workspace_root/memory-bank/learned-patterns.md"
learned_patterns_context=""
learned_patterns_escaped=""

if [ -f "$learned_patterns_file" ]; then
    learned_patterns_context=$(cat "$learned_patterns_file")
fi

# Escape learned patterns context for JSON
if [ -n "$learned_patterns_context" ]; then
    learned_patterns_escaped=$(echo "$learned_patterns_context" | sed 's/\\/\\\\/g' | sed 's/"/\\"/g' | awk '{printf "%s\\n", $0}')
fi

# Initialize session intent file if it doesn't exist or is stale
session_intent_file="$workspace_root/.aipmos/session-intent.json"
session_id=$(date +%s)$$  # Timestamp + PID for uniqueness
current_time=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Check if session intent exists and is from today (stale check)
init_intent=false
if [ -f "$session_intent_file" ]; then
    file_time=$(stat -f "%Sm" -t "%Y-%m-%d" "$session_intent_file" 2>/dev/null || stat -c "%y" "$session_intent_file" 2>/dev/null | cut -d' ' -f1)
    today=$(date +%Y-%m-%d)
    if [ "$file_time" != "$today" ]; then
        init_intent=true
    fi
else
    init_intent=true
fi

if [ "$init_intent" = true ]; then
    # Create new session intent template
    cat > "$session_intent_file" << EOF
{
  "session_id": "$session_id",
  "start_time": "$current_time",
  "intent": "",
  "user_description": ""
}
EOF
fi

# Escape memory context for JSON
if [ -n "$memory_context" ]; then
    memory_escaped=$(echo "$memory_context" | sed 's/\\/\\\\/g' | sed 's/"/\\"/g' | awk '{printf "%s\\n", $0}')
fi

# Build additional context
additional_context="<EXTREMELY-IMPORTANT>\\nYou have many skills.\\n\\n**Below is the full content of your '\''using-skills'\'' skill - your introduction to using skills. For all other skills, use the '\''Skill'\'' tool:**\\n\\n${using_skills_escaped}"

if [ -n "$memory_escaped" ]; then
    additional_context="${additional_context}\\n\\n---\\n\\n## Memory Context\\n\\n${memory_escaped}"
fi

if [ -n "$learned_patterns_escaped" ]; then
    additional_context="${additional_context}\\n\\n---\\n\\n## Recently Learned Patterns\\n\\n${learned_patterns_escaped}"
fi

# Output context injection as JSON
cat <<EOF
{
  "hookSpecificOutput": {
    "hookEventName": "SessionStart",
    "additionalContext": "${additional_context}"
  }
}
EOF

# Initialize observers and record session start (Phase 1 Memory System)
# Use venv python if available, otherwise system python
VENV_PYTHON="$workspace_root/.venv/bin/python3"
if [ -f "$VENV_PYTHON" ]; then
    PYTHON_CMD="$VENV_PYTHON"
else
    PYTHON_CMD="python3"
fi

export WORKSPACE_ROOT="$workspace_root"
"$PYTHON_CMD" -c "
import asyncio
import sys
import os
from pathlib import Path

workspace = Path(os.environ.get('WORKSPACE_ROOT', '.'))

# Add automation scripts to path
sys.path.insert(0, str(workspace / 'scripts/automation'))

try:
    from observers.observer_manager import ObserverManager

    async def main():
        manager = ObserverManager()
        await manager.initialize(workspace)
        time_observer = manager.get_observer('time_patterns')
        if time_observer:
            await time_observer.mark_session_start()

    asyncio.run(main())
except Exception as e:
    # Graceful degradation - don't fail session start
    sys.stderr.write(f'Observer initialization failed: {e}\n')
"

exit 0
