"""
Time Patterns Observer - Captures session timing and activity patterns.

Tracks when you work, session duration, and idle periods.
This helps understand your work schedule and productivity patterns.
"""

import logging
from typing import Any, Dict, Optional
from datetime import datetime, timezone
import time

from .base_observer import BaseObserver

logger = logging.getLogger(__name__)


class TimePatternsObserver(BaseObserver):
    """Captures time-based activity patterns.

    Tracks:
    - Session start/end times
    - Session duration
    - Time of day patterns (hour of day, day of week)
    - Active work vs. idle periods
    """

    def get_event_type(self) -> str:
        return "time_patterns"

    def __init__(self, db_path: str, session_id: Optional[str] = None):
        super().__init__(db_path, session_id)
        self._session_start_time: Optional[float] = None
        self._last_activity_time: Optional[float] = None

    async def capture(
        self,
        activity_type: str,
        duration_seconds: Optional[int] = None,
        **kwargs
    ) -> Optional[Dict[str, Any]]:
        """Capture time-based activity event.

        Args:
            activity_type: Type of activity ('session_start', 'session_end', 'active_work', 'idle')
            duration_seconds: Optional duration in seconds
        """
        if not activity_type:
            return None

        now = datetime.now(timezone.utc)

        return {
            "activity_type": activity_type,
            "duration_seconds": duration_seconds,
            "time_of_day_hour": now.hour,
            "day_of_week": now.weekday(),  # 0=Monday, 6=Sunday
            "captured_at": now.isoformat()
        }

    async def mark_session_start(self):
        """Mark session start time."""
        self._session_start_time = time.time()
        self._last_activity_time = self._session_start_time

        await self.observe_and_record(
            activity_type="session_start",
            duration_seconds=0
        )

    async def mark_session_end(self) -> Optional[int]:
        """Mark session end and calculate duration.

        Returns:
            Session duration in seconds, or None if session wasn't started
        """
        if self._session_start_time is None:
            logger.warning("Session end called without session start")
            return None

        duration_seconds = int(time.time() - self._session_start_time)

        await self.observe_and_record(
            activity_type="session_end",
            duration_seconds=duration_seconds
        )

        # Reset for next session
        self._session_start_time = None
        self._last_activity_time = None

        return duration_seconds

    async def record_activity(self, activity_type: str = "active_work"):
        """Record activity (work or idle)."""
        now = time.time()

        # Calculate duration since last activity
        duration_seconds = None
        if self._last_activity_time is not None:
            duration_seconds = int(now - self._last_activity_time)

        await self.observe_and_record(
            activity_type=activity_type,
            duration_seconds=duration_seconds
        )

        self._last_activity_time = now

    async def mark_idle_period(self, duration_seconds: int):
        """Record an idle period (no activity)."""
        await self.observe_and_record(
            activity_type="idle",
            duration_seconds=duration_seconds
        )

    def get_session_duration(self) -> Optional[int]:
        """Get current session duration in seconds without recording.

        Returns:
            Current session duration, or None if session not started
        """
        if self._session_start_time is None:
            return None
        return int(time.time() - self._session_start_time)
