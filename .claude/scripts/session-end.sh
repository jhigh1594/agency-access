#!/bin/bash
# SessionEnd hook - records session end and updates memory.md
# Phase 1 Memory System: Records session timing in events.db

set -euo pipefail

# Discover workspace root
workspace_root=$(pwd)
while [ "$workspace_root" != "/" ] && [ ! -d "$workspace_root/.aipmos" ]; do
    workspace_root=$(dirname "$workspace_root")
done

# Record session end in events.db (Phase 1 Memory System)
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
            duration = await time_observer.mark_session_end()
            if duration:
                print(f'Session duration: {duration}s')

    asyncio.run(main())
except Exception as e:
    # Graceful degradation - don't fail session end
    sys.stderr.write(f'Session end recording failed: {e}\n')
" 2>&1 || true

memory_file="$workspace_root/memory-bank/memory.md"
session_intent_file="$workspace_root/.aipmos/session-intent.json"

# Check if there are recent commits
if [ -d "$workspace_root/.git" ]; then
    recent_commits=$(git -C "$workspace_root" log --since="24 hours ago" --oneline | wc -l | tr -d ' ')

    if [ "$recent_commits" -gt 0 ]; then
        echo ""
        echo "## Auto-updating memory.md"

        # Run the automated memory updater (now session-aware)
        if [ -f "$workspace_root/scripts/automation/memory_updater.py" ]; then
            python3 "$workspace_root/scripts/automation/memory_updater.py" 2>&1 || true
        fi

        echo ""
        echo "✅ Memory.md automatically updated with $recent_commits recent commit(s)"
    fi
fi

# Run memory maintainer for bloat prevention
if [ -f "$workspace_root/scripts/automation/memory_maintainer.py" ]; then
    python3 "$workspace_root/scripts/automation/memory_maintainer.py" --workspace "$workspace_root" 2>&1 || true
fi

# Clear session intent for next session
if [ -f "$session_intent_file" ]; then
    # Backup the intent before clearing (for debugging/history)
    session_id=$(python3 -c "import json; print(json.load(open('$session_intent_file'))['session_id'])" 2>/dev/null || echo "unknown")
    backup_dir="$workspace_root/.aipmos/sessions-archive"
    mkdir -p "$backup_dir"
    cp "$session_intent_file" "$backup_dir/${session_id}.json" 2>/dev/null || true

    # Reset intent file for next session
    current_time=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    new_session_id=$(date +%s)$$
    cat > "$session_intent_file" << EOF
{
  "session_id": "$new_session_id",
  "start_time": "$current_time",
  "intent": "",
  "user_description": ""
}
EOF
fi

exit 0
