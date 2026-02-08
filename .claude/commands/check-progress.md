Check what's changed since the last memory update.

This command shows deltas and activity since memory files were last updated, helping you decide what needs to be documented.

## Execution

Use Python to analyze progress:

```python
import sys
from datetime import datetime, timedelta
from pathlib import Path
import subprocess
import json

sys.path.insert(0, 'scripts/automation')

from session_tracking.session_tracker import (
    SessionTracker,
    cleanup_old_sessions,
    get_current_git_branch,
)

workspace = Path('.')
memory_bank = workspace / 'memory-bank'
tracker = SessionTracker(workspace_root=workspace)

# Get last update times for memory files
memory_files = {
    'activeContext.md': memory_bank / 'activeContext.md',
    'progress.md': memory_bank / 'progress.md',
    'techContext.md': memory_bank / 'techContext.md',
    'systemPatterns.md': memory_bank / 'systemPatterns.md',
}

last_updates = {}
for name, path in memory_files.items():
    if path.exists():
        mtime = datetime.fromtimestamp(path.stat().st_mtime)
        last_updates[name] = mtime

# Find oldest update (baseline for "last memory update")
if last_updates:
    baseline = min(last_updates.values())
else:
    baseline = datetime.now() - timedelta(days=30)

# Get git commits since baseline
result = subprocess.run(
    ['git', 'log', '--since', baseline.isoformat(), '--oneline', '--no-merges'],
    capture_output=True,
    text=True,
    cwd=workspace
)
commits = result.stdout.strip().split('\n') if result.stdout.strip() else []

# Get current session activity (all events)
all_events = tracker.load_events()
recent_events = [e for e in all_events if e.timestamp > baseline]

# Modified files since baseline
result = subprocess.run(
    ['git', 'diff', '--name-only', f'{{@{baseline.isoformat()}}}', 'HEAD'],
    capture_output=True,
    text=True,
    cwd=workspace
)
modified_files = set(result.stdout.strip().split('\n')) if result.stdout.strip() else set()

# Build output
print(f"## Progress Check: Changes since {baseline.strftime('%Y-%m-%d %H:%M')}")
print()

# Last updates
print("### Memory File Updates")
for name, mtime in sorted(last_updates.items(), key=lambda x: x[1]):
    age = (datetime.now() - mtime).days
    status = "✓" if age < 7 else "⚠" if age < 30 else "✗"
    print(f"  {status} {name}: {mtime.strftime('%Y-%m-%d')} ({age}d ago)")
print()

# Recent commits
if commits:
    print(f"### Git Commits ({len(commits)} since baseline)")
    for commit in commits[:10]:
        print(f"  • {commit}")
    if len(commits) > 10:
        print(f"  ... and {len(commits) - 10} more")
    print()

# Session activity
if recent_events:
    print(f"### Session Activity ({len(recent_events)} events)")
    for event in recent_events[:15]:
        print(f"  • {event}")
    if len(recent_events) > 15:
        print(f"  ... and {len(recent_events) - 15} more")
    print()

# Modified memory-relevant files
memory_relevant = [f for f in modified_files if any(
    x in f for x in ['memory-bank/', 'Products/', 'PRDs/', '.claude/', 'scripts/automation']
)]
if memory_relevant:
    print(f"### Modified Relevant Files ({len(memory_relevant)})")
    for f in sorted(memory_relevant)[:20]:
        print(f"  • {f}")
    if len(memory_relevant) > 20:
        print(f"  ... and {len(memory_relevant) - 20} more")
    print()
```

Run using Bash.

## Output Sections

1. **Memory File Updates** - Last update time for each memory file with age indicators
2. **Git Commits** - Commits since baseline (last memory update)
3. **Session Activity** - Tracked events from current session
4. **Modified Relevant Files** - Files changed that might affect memory

## Status Indicators

- ✓ = Fresh (< 7 days)
- ⚠ = Aging (7-30 days)
- ✗ = Stale (> 30 days)

## After Progress Check

Ask the user:

**"Based on this activity, which memory files need updates?**

Common patterns:
- **activeContext.md** - Update if priorities shifted or work completed
- **progress.md** - Update if milestones reached or blockers resolved
- **techContext.md** - Update if tools/infrastructure changed
- **systemPatterns.md** - Update if new workflows established

Would you like me to help update any of these files?"**

## Notes

- Baseline = oldest memory file modification time
- Shows both git history and session-tracker activity
- Helps identify what documentation is overdue
- Complements `/refresh-memory` (shows deltas vs. full reload)
