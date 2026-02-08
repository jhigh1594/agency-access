"""
Abstract base class for passive observers.

Provides common database operations and capture/record workflow.
All observers inherit from this and implement:
- get_event_type(): Return event type identifier
- capture(**kwargs): Capture event data, return dict or None
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, Optional
from datetime import datetime, timezone
import json
import aiosqlite
import logging

logger = logging.getLogger(__name__)


class BaseObserver(ABC):
    """Abstract base class for passive observers.

    Observers passively capture events during normal workflow without
    disruption. All database writes are async and non-blocking.
    """

    def __init__(self, db_path: str, session_id: Optional[str] = None):
        """Initialize observer with database path and optional session ID."""
        self.db_path = db_path
        self.session_id = session_id
        self._enabled = True

    @abstractmethod
    def get_event_type(self) -> str:
        """Return event type identifier (e.g., 'command_usage', 'file_clusters')."""
        pass

    @abstractmethod
    async def capture(self, **kwargs) -> Optional[Dict[str, Any]]:
        """Capture event data from kwargs.

        Returns dict with captured data or None if nothing to capture.
        Include 'metadata' key for optional context.
        """
        pass

    async def record(self, event_data: Dict[str, Any], metadata: Optional[Dict] = None):
        """Record captured event to events database.

        Gracefully handles database errors - logs but doesn't raise.
        """
        if not self._enabled:
            return

        try:
            async with aiosqlite.connect(self.db_path) as db:
                await db.execute(
                    """INSERT INTO events
                       (event_type, event_timestamp, event_data, session_id, metadata)
                       VALUES (?, ?, ?, ?, ?)""",
                    (
                        self.get_event_type(),
                        datetime.now(timezone.utc).isoformat(),
                        json.dumps(event_data),
                        self.session_id,
                        json.dumps(metadata) if metadata else None
                    )
                )
                await db.commit()
        except Exception as e:
            logger.error(f"Observer {self.__class__.__name__} failed to record: {e}")

    async def observe_and_record(self, **kwargs):
        """Convenience method: capture and record in one call.

        Wraps capture() and record() with error handling.
        """
        try:
            event_data = await self.capture(**kwargs)
            if event_data:
                await self.record(event_data, event_data.pop('metadata', None))
        except Exception as e:
            logger.error(f"Observer {self.__class__.__name__} failed: {e}")

    def disable(self):
        """Disable this observer (no-op for graceful degradation)."""
        self._enabled = False

    def enable(self):
        """Re-enable this observer."""
        self._enabled = True
