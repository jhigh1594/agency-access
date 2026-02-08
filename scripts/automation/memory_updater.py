#!/usr/bin/env python3
"""
Session-Aware Memory Updater

Updates memory-bank/memory.md by combining session intent with git commits.
This captures not just WHAT changed, but WHY you were working on it.

Session entry format:
### [Date] Session: [Intent]
**Context**: [Additional context from user message]
**Planned**: [What you intended to do]
**Completed**: [What git commits show]
**Outcome**: [Summary of accomplishment]
"""

import argparse
import json
import re
from datetime import datetime, timedelta
from pathlib import Path
import subprocess


def load_session_intent(workspace_root: Path) -> dict:
    """Load session intent from .aipmos/session-intent.json."""
    intent_file = workspace_root / ".aipmos" / "session-intent.json"

    if not intent_file.exists():
        return None

    try:
        with open(intent_file, 'r') as f:
            data = json.load(f)
            # Only return if intent is actually set (non-empty)
            if data.get("intent") and data.get("intent").strip():
                return data
            return None
    except (json.JSONDecodeError, IOError):
        return None


def extract_first_user_message(content: str) -> str:
    """Extract the first user message from a SpecStory session file.

    SpecStory format uses:
    _**User**_
    [user message content here]
    ---
    """
    lines = content.split("\n")
    for i, line in enumerate(lines):
        # FIX: Match actual pattern "_**User**_" not "_**User ("
        if line.strip() == "_**User**_":
            # Found user message marker, next non-empty line has the message
            if i + 1 < len(lines):
                msg_line = lines[i + 1].strip()
                # Skip empty lines and continuation markers
                if msg_line and msg_line != "---":
                    # Extract message content (might be multi-line until ---)
                    msg_parts = [msg_line]
                    for j in range(i + 2, min(i + 15, len(lines))):  # Increased lookahead
                        next_line = lines[j].strip()
                        if next_line == "---":
                            break
                        if next_line and not next_line.startswith("_**"):
                            msg_parts.append(next_line)
                    return " ".join(msg_parts)[:500]  # Increased limit to 500 chars
    return ""


def extract_session_metadata(content: str) -> dict:
    """Extract session metadata from SpecStory file headers."""
    metadata = {}

    # Extract session ID
    session_match = re.search(r'<!-- cursor Session ([a-f0-9-]+)', content)
    if session_match:
        metadata['session_id'] = session_match.group(1)

    # Extract timestamp from header (more reliable than filename)
    timestamp_match = re.search(r'\((\d{4}-\d{2}-\d{2} \d{2}:\d{2}Z)\)', content)
    if timestamp_match:
        metadata['timestamp'] = timestamp_match.group(1)

    # Extract model if present
    model_match = re.search(r'Agent \(model (\S+), mode (\S+)\)', content)
    if model_match:
        metadata['model'] = model_match.group(1)
        metadata['mode'] = model_match.group(2)

    return metadata


def score_session_relevance(file_path: Path, content: str) -> float:
    """Score a session file by relevance to actual work activity.

    Higher scores indicate more substantive work (vs. simple commands).
    """
    score = 0.0

    # Content length (substantive sessions are longer)
    score += min(len(content) / 5000, 10)  # Max 10 points for length

    # Tool usage indicates active work
    tool_count = content.count("<tool-use")
    score += min(tool_count * 0.3, 5)  # Max 5 points for tools

    # Extract user message length
    user_msg = extract_first_user_message(content)
    score += min(len(user_msg) / 100, 5)  # Max 5 points for user intent

    # Penalize common low-value patterns
    low_value_patterns = [
        "git commit command",
        "/commit",
        "git status",
        "git add",
        "run_terminal_command"
    ]
    content_lower = content.lower()
    for pattern in low_value_patterns:
        if pattern in content_lower:
            score -= 3  # Significant penalty for command-only sessions

    return max(score, 0)


def infer_session_intent_from_history(workspace_root: Path) -> dict:
    """Infer session intent from recent SpecStory history files.

    Now with content relevance scoring to pick the most substantive session.
    """
    history_dir = workspace_root / ".specstory" / "history"

    if not history_dir.exists():
        return None

    # Get recent session files (last 10)
    try:
        session_files = sorted(
            history_dir.glob("*.md"),
            key=lambda p: p.stat().st_mtime,
            reverse=True
        )[:10]
    except (OSError, IOError):
        return None

    if not session_files:
        return None

    # Score each session by relevance
    scored_sessions = []
    for session_file in session_files:
        try:
            content = session_file.read_text()
            score = score_session_relevance(session_file, content)
            scored_sessions.append((session_file, score))
        except (OSError, IOError):
            continue

    if not scored_sessions:
        return None

    # Pick the highest-scoring session
    best_file, best_score = max(scored_sessions, key=lambda x: x[1])

    if best_score < 3:  # Threshold for "substantive" work
        return None

    latest_file = best_file

    # Parse filename: "2026-01-28_20-02Z-dark-mode-application-value.md"
    # Extract the descriptive part (everything after the timestamp)
    match = re.match(r"\d{4}-\d{2}-\d{2}_\d{2}-\d{2}Z-(.+)\.md", latest_file.name)

    if match:
        intent_title = match.group(1).replace("-", " ")

        # Try to read the file for additional context
        try:
            content = latest_file.read_text()
            user_msg = extract_first_user_message(content)
            metadata = extract_session_metadata(content)
        except (OSError, IOError):
            user_msg = ""
            metadata = {}

        # Use user message as primary intent if available
        if len(user_msg) > 50:
            intent = user_msg[:100]  # First 100 chars of user message
        else:
            intent = intent_title

        start_time = parse_filename_timestamp(latest_file.name)

        result = {
            "intent": intent,
            "user_description": user_msg,
            "start_time": start_time,
            "source": "specstory",
            "session_id": metadata.get("session_id"),
            "model": metadata.get("model"),
        }

        return result

    return None


def parse_filename_timestamp(filename: str) -> str:
    """Parse timestamp from SpecStory filename and return ISO 8601 format."""
    # Filename format: "2026-01-28_20-02Z-dark-mode-application-value.md"
    match = re.match(r"(\d{4}-\d{2}-\d{2})_(\d{2})-(\d{2})Z-", filename)
    if match:
        date_part = match.group(1)
        hour = match.group(2)
        minute = match.group(3)
        # Return ISO 8601 format
        return f"{date_part}T{hour}:{minute}:00Z"
    return ""


def get_git_commits_since_session_start(workspace_root: Path, session_start: str = None) -> list:
    """Get git commits since session started (or last 24 hours)."""
    cmd = ["git", "log", "--oneline", "--format=%H|%s|%ai"]

    # Parse time range
    if session_start:
        try:
            # Parse ISO 8601 datetime
            start_dt = datetime.fromisoformat(session_start.replace('Z', '+00:00'))
            date_str = start_dt.strftime("%Y-%m-%d %H:%M:%S")
            cmd.extend(["--since", date_str])
        except ValueError:
            # Fallback to 24 hours if parse fails
            cmd.extend(["--since", "24 hours ago"])
    else:
        cmd.extend(["--since", "24 hours ago"])

    result = subprocess.run(
        cmd,
        cwd=workspace_root,
        capture_output=True,
        text=True,
        check=False  # Don't fail if no commits
    )

    commits = []
    for line in result.stdout.strip().split("\n"):
        if line:
            parts = line.split("|", 2)
            if len(parts) == 3:
                commits.append({
                    "hash": parts[0],
                    "message": parts[1],
                    "date": parts[2]
                })

    return commits


def generate_session_summary(intent: str, commits: list) -> str:
    """Generate a session summary combining intent with actual commits.

    This is where the magic happens - we combine planned work (intent)
    with actual work (commits) to create meaningful session summaries.
    """
    if not commits:
        return f"No commits made. Session may have been planning, research, or discussion."

    # Extract themes from commits
    themes = set()
    for commit in commits:
        msg_lower = commit["message"].lower()
        if any(kw in msg_lower for kw in ["fix", "bug", "resolve"]):
            themes.add("bug fixes")
        if any(kw in msg_lower for kw in ["feat", "add", "implement", "create"]):
            themes.add("feature development")
        if any(kw in msg_lower for kw in ["doc", "readme", "update"]):
            themes.add("documentation")
        if any(kw in msg_lower for kw in ["refactor", "clean", "simplify"]):
            themes.add("code improvement")
        if any(kw in msg_lower for kw in ["test", "spec"]):
            themes.add("testing")

    # Build summary
    parts = []

    if intent:
        parts.append(f"Planned: {intent}")

    if themes:
        parts.append(f"Completed: {', '.join(sorted(themes))}")

    if len(commits) > 0:
        # Summarize commits (show patterns, not just raw messages)
        commit_summary = summarize_commits(commits)
        parts.append(f"Outcome: {commit_summary}")

    return " | ".join(parts) if parts else "Session activity recorded."


def summarize_commits(commits: list) -> str:
    """Create a concise summary of commit activity."""
    if not commits:
        return "no code changes"

    # Group related commits
    messages = [c["message"] for c in commits]

    # Count patterns
    patterns = {
        "memory": sum(1 for m in messages if "memory" in m.lower()),
        "session": sum(1 for m in messages if "session" in m.lower()),
        "doc": sum(1 for m in messages if any(kw in m.lower() for kw in ["doc", "readme", "update"])),
        "fix": sum(1 for m in messages if any(kw in m.lower() for kw in ["fix", "bug"])),
    }

    # Build summary
    summary_parts = []
    for pattern, count in patterns.items():
        if count > 0:
            summary_parts.append(f"{count} {pattern}")

    if summary_parts:
        return ", ".join(summary_parts)
    elif len(commits) == 1:
        return f"{commits[0]['message'][:40]}..."
    else:
        return f"{len(commits)} commit(s)"


def create_session_entry(intent_data: dict, commits: list) -> str:
    """Create a formatted session entry for memory.md."""
    # Get session info
    intent = intent_data.get("intent", "") if intent_data else ""
    user_desc = intent_data.get("user_description", "") if intent_data else ""
    start_time_str = intent_data.get("start_time", "") if intent_data else ""
    source = intent_data.get("source", "") if intent_data else ""

    # Parse start time for display
    if start_time_str:
        try:
            start_dt = datetime.fromisoformat(start_time_str.replace('Z', '+00:00'))
            date_str = start_dt.strftime("%B %d, %Y")
        except ValueError:
            date_str = datetime.now().strftime("%B %d, %Y")
    else:
        date_str = datetime.now().strftime("%B %d, %Y")

    # Build session entry
    lines = []
    lines.append(f"### [{date_str}] Session: {intent or 'Work Session'}")

    if user_desc:
        lines.append(f"**Context**: {user_desc}")

    lines.append(f"**Planned**: {intent or 'Not specified'}")

    if commits:
        commit_msgs = [f"- {c['message']}" for c in commits[:5]]  # Max 5 commits shown
        lines.append(f"**Completed**:")
        lines.extend(commit_msgs)
        if len(commits) > 5:
            lines.append(f"  ... and {len(commits) - 5} more commit(s)")
    else:
        lines.append("**Completed**: No code commits (session may have been planning/research)")

    # Generate outcome summary
    outcome = generate_session_summary(intent, commits)
    lines.append(f"**Outcome**: {outcome}")

    # Add source tracking if from SpecStory
    if source == "specstory":
        session_id = intent_data.get("session_id", "")
        if session_id:
            lines.append(f"**Session ID**: {session_id}")

    lines.append("")  # Blank line after session

    return "\n".join(lines)


def append_session_to_memory(memory_file: Path, session_entry: str) -> bool:
    """Append session entry to memory.md in the correct location."""
    if not memory_file.exists():
        return False

    content = memory_file.read_text()

    # Find where to insert - after "Current Focus" section
    # or before the first "##" section that's not Current Focus
    if "## Current Focus" in content:
        # Insert after Current Focus section
        lines = content.split("\n")
        insert_idx = None

        for i, line in enumerate(lines):
            if line.startswith("### [") and i > 0:
                # Found previous session entry, insert before it
                insert_idx = i
                break

            if line.startswith("##") and line != "## Current Focus":
                # Found next major section, insert here
                insert_idx = i
                break

        if insert_idx is None:
            # No section found, append to end
            insert_idx = len(lines)

        # Insert session entry
        lines.insert(insert_idx, session_entry)
        content = "\n".join(lines)
    else:
        # No Current Focus section, append to end
        content = content + "\n" + session_entry

    # Update timestamp
    today = datetime.now().strftime("%B %d, %Y")
    content = re.sub(
        r'\*\*Last Updated\*\*: .*',
        f'**Last Updated**: {today}',
        content
    )

    memory_file.write_text(content)
    return True


def run_memory_maintainer(workspace_root: Path):
    """Run memory maintainer to prevent bloat."""
    maintainer_script = workspace_root / "scripts/automation" / "memory_maintainer.py"
    if maintainer_script.exists():
        subprocess.run(
            ["python3", str(maintainer_script), "--workspace", str(workspace_root)],
            capture_output=True,
            check=False
        )


def main():
    parser = argparse.ArgumentParser(description="Update memory.md with session-aware summaries")
    parser.add_argument("--workspace", type=Path, default=Path.cwd(), help="Workspace root")
    parser.add_argument("--dry-run", action="store_true", help="Show what would be updated without writing")
    args = parser.parse_args()

    workspace = args.workspace
    memory_file = workspace / "memory-bank" / "memory.md"

    if not memory_file.exists():
        print(f"❌ Memory file not found: {memory_file}")
        return 1

    # Load session intent (try multiple sources)
    intent_data = load_session_intent(workspace)

    # Fallback: infer from SpecStory history if no manual intent
    if not intent_data or not intent_data.get("intent"):
        print("ℹ️  No manual session intent - checking SpecStory history...")
        intent_data = infer_session_intent_from_history(workspace)
        if intent_data:
            print(f"✓ Inferred intent from SpecStory: {intent_data.get('intent', '')[:60]}...")
        else:
            print("ℹ️  No session intent found - using git commits only")

    # Get commits since session start
    session_start = intent_data.get("start_time") if intent_data else None
    commits = get_git_commits_since_session_start(workspace, session_start)

    # Capture success signals for commits (Phase 1 Memory System)
    if commits:
        try:
            import asyncio
            import logging
            logging.basicConfig(level=logging.WARNING)  # Quiet logging

            sys.path.insert(0, str(workspace / "scripts/automation"))
            from observers.observer_manager import ObserverManager

            async def capture_signals():
                manager = ObserverManager()
                await manager.initialize(workspace)
                success_observer = manager.get_observer("success_signals")
                if success_observer:
                    await success_observer.capture_git_commits([c["message"] for c in commits])

            asyncio.run(capture_signals())
        except Exception as e:
            # Graceful degradation - don't fail memory update
            pass  # Silently ignore observer errors

    if not commits and not intent_data:
        print("✅ No session activity to record")
        return 0

    # Create session entry
    session_entry = create_session_entry(intent_data, commits)

    if args.dry_run:
        print("\nWould add to memory.md:")
        print(session_entry)
        return 0

    # Append to memory
    if append_session_to_memory(memory_file, session_entry):
        intent_desc = intent_data.get("intent", "unknown") if intent_data else "unknown"
        print(f"✅ Updated memory.md with session: {intent_desc[:50]}...")
        print(f"   File: {memory_file}")
        print(f"   Commits: {len(commits)}")

        # Run memory maintainer
        run_memory_maintainer(workspace)
        return 0
    else:
        print("⚠️  Failed to update memory.md")
        return 1


if __name__ == "__main__":
    exit(main())
