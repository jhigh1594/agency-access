"""
Command Usage Observer - Captures CLI command and skill usage.

Tracks which commands you use, how often, and with what context.
This helps identify your most-used tools and workflow patterns.
"""

import logging
from typing import Any, Dict, Optional
from datetime import datetime, timezone

from .base_observer import BaseObserver

logger = logging.getLogger(__name__)


class CommandUsageObserver(BaseObserver):
    """Captures CLI command and skill usage patterns.

    Tracks:
    - Command/skill name
    - Execution context (args, flags)
    - Duration (if available)
    - Usage frequency over time
    """

    def get_event_type(self) -> str:
        return "command_usage"

    async def capture(
        self,
        command_name: str,
        command_context: Optional[str] = None,
        execution_duration_ms: Optional[int] = None,
        **kwargs
    ) -> Optional[Dict[str, Any]]:
        """Capture command usage event.

        Args:
            command_name: Name of command or skill (e.g., '/today', '/brainstorm')
            command_context: Optional context like args or flags
            execution_duration_ms: Optional duration in milliseconds
        """
        if not command_name:
            return None

        return {
            "command_name": command_name,
            "command_context": command_context,
            "execution_duration_ms": execution_duration_ms,
            "captured_at": datetime.now(timezone.utc).isoformat()
        }

    async def capture_command(
        self,
        command_name: str,
        args: Optional[list] = None,
        flags: Optional[dict] = None,
        duration_ms: Optional[int] = None
    ):
        """Convenience method to capture command with args/flags."""
        context = None
        if args or flags:
            parts = []
            if args:
                parts.append("args:" + ",".join(str(a) for a in args))
            if flags:
                parts.append("flags:" + ",".join(f"{k}={v}" for k, v in flags.items()))
            context = " ".join(parts)

        await self.observe_and_record(
            command_name=command_name,
            command_context=context,
            execution_duration_ms=duration_ms
        )
