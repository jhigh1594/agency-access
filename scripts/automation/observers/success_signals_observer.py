"""
Success Signals Observer - Captures outcomes like git commits and task completions.

Tracks successful outcomes that indicate progress and completion.
This helps identify what work gets done and measure productivity.
"""

import logging
import re
from typing import Any, Dict, Optional, List
from datetime import datetime, timezone

from .base_observer import BaseObserver

logger = logging.getLogger(__name__)


class SuccessSignalsObserver(BaseObserver):
    """Captures success signals and outcomes.

    Tracks:
    - Git commits (with commit messages)
    - Task completions
    - PR merges
    - Signal strength (0.0 to 1.0 confidence/importance)
    """

    # Default signal weights - higher = more significant
    DEFAULT_WEIGHTS = {
        "git_commit": 0.8,
        "task_complete": 1.0,
        "pr_merge": 0.9,
        "test_pass": 0.7
    }

    def get_event_type(self) -> str:
        return "success_signals"

    def __init__(self, db_path: str, session_id: Optional[str] = None, signal_weights: Optional[Dict[str, float]] = None):
        super().__init__(db_path, session_id)
        self.signal_weights = signal_weights or self.DEFAULT_WEIGHTS.copy()

    async def capture(
        self,
        signal_type: str,
        context_data: Optional[str] = None,
        signal_strength: Optional[float] = None,
        **kwargs
    ) -> Optional[Dict[str, Any]]:
        """Capture success signal event.

        Args:
            signal_type: Type of signal ('git_commit', 'task_complete', etc.)
            context_data: Optional context (commit message, task description, etc.)
            signal_strength: Optional 0.0-1.0 strength (auto-calculated if not provided)
        """
        if not signal_type:
            return None

        # Calculate signal strength if not provided
        if signal_strength is None:
            signal_strength = self._calculate_signal_strength(signal_type)

        # Clamp to valid range
        signal_strength = max(0.0, min(1.0, signal_strength))

        return {
            "signal_type": signal_type,
            "signal_strength": signal_strength,
            "context_data": context_data,
            "captured_at": datetime.now(timezone.utc).isoformat()
        }

    def _calculate_signal_strength(self, signal_type: str) -> float:
        """Calculate signal strength based on type and configured weights."""
        return self.signal_weights.get(signal_type, 0.5)  # Default to 0.5 if unknown

    async def capture_git_commits(self, commit_messages: List[str]):
        """Capture multiple git commits as success signals."""
        for msg in commit_messages:
            await self.observe_and_record(
                signal_type="git_commit",
                context_data=msg
            )

    async def capture_git_commit(self, commit_message: str):
        """Capture single git commit as success signal."""
        await self.observe_and_record(
            signal_type="git_commit",
            context_data=commit_message
        )

    async def capture_task_complete(self, task_description: str, importance: float = 1.0):
        """Capture task completion with optional importance multiplier."""
        signal_strength = self.signal_weights.get("task_complete", 1.0) * importance
        await self.observe_and_record(
            signal_type="task_complete",
            context_data=task_description,
            signal_strength=signal_strength
        )

    async def capture_pr_merge(self, pr_description: str):
        """Capture pull request merge as success signal."""
        await self.observe_and_record(
            signal_type="pr_merge",
            context_data=pr_description
        )

    async def capture_test_pass(self, test_suite: str, pass_count: int, total_count: int):
        """Capture test suite pass with coverage."""
        if total_count == 0:
            coverage = 0.0
        else:
            coverage = pass_count / total_count

        # Signal strength based on pass rate
        signal_strength = self.signal_weights.get("test_pass", 0.7) * coverage

        await self.observe_and_record(
            signal_type="test_pass",
            context_data=f"{test_suite}: {pass_count}/{total_count} passed ({coverage*100:.1f}%)",
            signal_strength=signal_strength
        )

    def infer_signal_from_commit_message(self, commit_message: str) -> Optional[tuple[str, float]]:
        """Infer signal type and strength from commit message pattern.

        Returns:
            Tuple of (signal_type, strength) or None if no match
        """
        msg_lower = commit_message.lower()

        # Test-related commits
        if any(word in msg_lower for word in ["test", "spec", "pytest"]):
            if any(word in msg_lower for word in ["fix", "pass"]):
                return ("test_pass", 0.7)
            return ("test_pass", 0.5)

        # Feature/delivery commits
        if any(word in msg_lower for word in ["feat", "feature", "add", "implement"]):
            return ("git_commit", 0.9)

        # Bug fixes
        if any(word in msg_lower for word in ["fix", "bug", "patch"]):
            return ("git_commit", 0.8)

        # Docs/refactor
        if any(word in msg_lower for word in ["doc", "docs", "refactor", "clean"]):
            return ("git_commit", 0.5)

        # Default
        return ("git_commit", 0.6)
