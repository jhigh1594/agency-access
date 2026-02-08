#!/usr/bin/env python3
"""
Memory Maintainer - Bloat Prevention for memory.md

Implements three-layer defense against memory bloat:
1. Hard Limits: Max 150 lines, 10KB file size
2. Rolling Window: Keep 10 most recent sessions, archive older
3. Smart Summarization: Summarize archived sessions when too large
"""

import argparse
import json
import re
from datetime import datetime
from pathlib import Path
from typing import Optional


class MemoryMaintainer:
    """Manages memory.md size through archival and summarization.

    Limits track SESSION CONTENT only, not the permanent reference material
    (Current Focus, Product Context, Technical Notes, etc.).
    """

    # Configuration limits
    MAX_LINES = 500  # Total file limit (increased to account for permanent content)
    MAX_SESSION_LINES = 200  # Session-specific limit (better metric)
    MAX_SIZE_BYTES = 10 * 1024  # 10KB
    KEEP_RECENT_SESSIONS = 10
    SUMMARIZE_THRESHOLD = 50  # Sessions in archive before summarization

    def __init__(self, workspace_root: Path):
        self.workspace = workspace_root
        self.memory_file = workspace_root / "memory-bank" / "memory.md"
        self.archive_file = workspace_root / "memory-bank" / "archive.md"
        self.session_intent_file = workspace_root / ".aipmos" / "session-intent.json"

    def get_file_size_kb(self) -> float:
        """Get file size in KB."""
        if not self.memory_file.exists():
            return 0
        return self.memory_file.stat().st_size / 1024

    def count_lines(self) -> int:
        """Count total lines in memory.md."""
        if not self.memory_file.exists():
            return 0
        return len(self.memory_file.read_text().split("\n"))

    def count_session_lines(self, content: str) -> int:
        """Count only the lines within session entries, excluding permanent content.

        This is the better metric for determining when to archive, as it ignores
        the permanent reference material (Current Focus, Product Context, etc.).
        """
        sessions = self.extract_sessions(content)
        session_lines = 0
        for date, intent, body in sessions:
            # Each session has: header line + body lines + blank line
            session_lines += 1  # "### [Date] Session: [Intent]"
            session_lines += len(body.split("\n"))  # body content
        return session_lines

    def extract_sessions(self, content: str) -> list:
        """Extract session entries from memory content.

        Session format: ### [Date] Session: [Intent]
        Stops at next major section (##), next session (### [), or end of file.
        """
        # Stop at: \n## (major section), ### [ (next session), or end of file
        pattern = r'### \[(.*?)\] Session: (.*?)\n(.*?)(?=\n## |### \[|$)'
        sessions = re.findall(pattern, content, re.DOTALL)
        return sessions

    def count_sessions(self, content: str) -> int:
        """Count session entries in memory content."""
        return len(content.split("### [")) - 1  # -1 because first split is before any ### [

    def archive_old_sessions(self) -> int:
        """Move old sessions to archive, keeping recent ones.

        Returns: Number of sessions archived
        """
        if not self.memory_file.exists():
            return 0

        content = self.memory_file.read_text()
        sessions = self.extract_sessions(content)

        if len(sessions) <= self.KEEP_RECENT_SESSIONS:
            return 0

        # Keep recent sessions, archive older ones
        recent_sessions = sessions[-self.KEEP_RECENT_SESSIONS:]
        archived_sessions = sessions[:-self.KEEP_RECENT_SESSIONS]

        # Build new memory content with only recent sessions
        # Remove all session entries first
        new_content = re.sub(r'### \[.*?\] Session: .*?\n(.*?)(?=### \[|$)', '', content, flags=re.DOTALL)
        new_content = new_content.strip()

        # Add back recent sessions
        for date, intent, body in recent_sessions:
            new_content += f"\n### [{date}] Session: {intent}\n{body}\n"

        # Write updated memory
        self.memory_file.write_text(new_content)

        # Append to archive
        archive_content = ""
        if self.archive_file.exists():
            archive_content = self.archive_file.read_text()

        for date, intent, body in archived_sessions:
            archive_content += f"### [{date}] Session: {intent}\n{body}\n"

        self.archive_file.write_text(archive_content)

        return len(archived_sessions)

    def summarize_archive_if_needed(self) -> bool:
        """Summarize archive if it has too many sessions.

        Returns: True if summarization was performed
        """
        if not self.archive_file.exists():
            return False

        content = self.archive_file.read_text()
        session_count = self.count_sessions(content)

        if session_count < self.SUMMARIZE_THRESHOLD:
            return False

        # Extract all sessions for summarization
        sessions = self.extract_sessions(content)

        # Group by month for summarization
        sessions_by_month = {}
        for date_str, intent, body in sessions:
            try:
                date = datetime.strptime(date_str, "%B %d, %Y")
                month_key = date.strftime("%B %Y")
                if month_key not in sessions_by_month:
                    sessions_by_month[month_key] = []
                sessions_by_month[month_key].append(intent)
            except ValueError:
                # Keep sessions with unparseable dates as-is
                continue

        # Build summarized archive
        summarized = "# Archived Sessions (Summarized)\n\n"

        for month in sorted(sessions_by_month.keys(), reverse=True):
            intents = sessions_by_month[month]
            # Create a thematic summary from intents
            unique_intents = list(set(intents))[:5]  # Top 5 unique intents
            summary_items = []
            for intent in unique_intents:
                intent_clean = intent.lower()
                if "memory" in intent_clean:
                    summary_items.append("Memory system improvements")
                elif "documentation" in intent_clean:
                    summary_items.append("Documentation updates")
                elif "feature" in intent_clean or "implement" in intent_clean:
                    summary_items.append("Feature development")
                elif "fix" in intent_clean or "bug" in intent_clean:
                    summary_items.append("Bug fixes and improvements")
                else:
                    summary_items.append(f"{intent[:50]}...")

            summarized += f"### {month}\n"
            for item in set(summary_items):
                summarized += f"- {item}\n"
            summarized += "\n"

        self.archive_file.write_text(summarized)
        return True

    def check_and_maintain(self) -> dict:
        """Check memory health and perform maintenance if needed.

        Returns: Dictionary with maintenance results
        """
        line_count = self.count_lines()
        size_kb = self.get_file_size_kb()
        session_count = 0
        session_lines = 0

        if self.memory_file.exists():
            content = self.memory_file.read_text()
            session_count = self.count_sessions(content)
            session_lines = self.count_session_lines(content)

        result = {
            "line_count": line_count,
            "session_lines": session_lines,
            "size_kb": round(size_kb, 2),
            "session_count": session_count,
            "action_taken": "none"
        }

        # Check hard limits (prioritize session_lines over total lines)
        if session_lines > self.MAX_SESSION_LINES or line_count > self.MAX_LINES or size_kb > (self.MAX_SIZE_BYTES / 1024):
            archived = self.archive_old_sessions()
            if archived > 0:
                result["action_taken"] = f"archived {archived} session(s)"
                # Re-check after archiving
                result["line_count"] = self.count_lines()
                result["size_kb"] = round(self.get_file_size_kb(), 2)
                result["session_count"] = self.count_sessions(self.memory_file.read_text())

        # Check if archive needs summarization
        if self.archive_file.exists():
            archive_session_count = self.count_sessions(self.archive_file.read_text())
            if archive_session_count >= self.SUMMARIZE_THRESHOLD:
                if self.summarize_archive_if_needed():
                    result["archive_summarized"] = True

        return result

    def health_status(self) -> str:
        """Get human-readable health status."""
        result = self.check_and_maintain()
        status = f"Memory Status: {result['line_count']} lines ({result['session_lines']} session), {result['size_kb']} KB, {result['session_count']} session{'s' if result['session_count'] != 1 else ''}"

        if result["action_taken"] != "none":
            status += f"\n✅ Action: {result['action_taken']}"
        # Use session_lines for warning (better metric than total lines)
        elif result["session_lines"] > self.MAX_SESSION_LINES * 0.8:
            status += f"\n⚠️  Approaching session limit ({result['session_lines']}/{self.MAX_SESSION_LINES} session lines)"
        elif result["line_count"] > self.MAX_LINES * 0.9:
            status += f"\n⚠️  Approaching file limit ({result['line_count']}/{self.MAX_LINES} total lines)"
        else:
            status += "\n✅ Healthy"

        return status


def main():
    parser = argparse.ArgumentParser(description="Maintain memory.md size")
    parser.add_argument("--workspace", type=Path, default=Path.cwd(), help="Workspace root")
    parser.add_argument("--check-only", action="store_true", help="Check status without making changes")
    parser.add_argument("--force-archive", action="store_true", help="Force archival of old sessions")
    parser.add_argument("--force-summarize", action="store_true", help="Force archive summarization")
    args = parser.parse_args()

    maintainer = MemoryMaintainer(args.workspace)

    if args.force_archive:
        archived = maintainer.archive_old_sessions()
        print(f"✅ Archived {archived} session(s)")
        return 0

    if args.force_summarize:
        if maintainer.summarize_archive_if_needed():
            print("✅ Archive summarized")
        else:
            print("ℹ️  Archive not large enough to summarize")
        return 0

    if args.check_only:
        print(maintainer.health_status())
        return 0

    # Default: check and maintain
    result = maintainer.check_and_maintain()
    print(maintainer.health_status())
    return 0


if __name__ == "__main__":
    exit(main())
