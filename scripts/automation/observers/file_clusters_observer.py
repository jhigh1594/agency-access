"""
File Clusters Observer - Captures files edited together.

Detects which files are commonly edited together, revealing work patterns.
This helps understand your workflow and group related work sessions.
"""

import logging
import hashlib
from typing import Any, Dict, Optional, List
from datetime import datetime, timezone
from pathlib import Path

from .base_observer import BaseObserver

logger = logging.getLogger(__name__)


class FileClustersObserver(BaseObserver):
    """Captures file clusters to identify work patterns.

    Tracks:
    - Files edited together (within cluster_timeout_seconds)
    - File operations (read, write, edit)
    - File content hashes (for change detection)
    - Cluster IDs grouping related file edits
    """

    # Files edited within this window are considered a cluster (default: 5 minutes)
    DEFAULT_CLUSTER_TIMEOUT = 300  # 5 minutes

    def __init__(self, db_path: str, session_id: Optional[str] = None, cluster_timeout: int = DEFAULT_CLUSTER_TIMEOUT):
        super().__init__(db_path, session_id)
        self.cluster_timeout = cluster_timeout
        self._current_cluster: Optional[str] = None
        self._last_edit_time: Optional[datetime] = None

    def get_event_type(self) -> str:
        return "file_clusters"

    async def capture(
        self,
        file_path: str,
        operation_type: str = "edit",
        file_content: Optional[str] = None,
        **kwargs
    ) -> Optional[Dict[str, Any]]:
        """Capture file operation event.

        Args:
            file_path: Path to file being operated on
            operation_type: Type of operation ('read', 'write', 'edit')
            file_content: Optional file content for hash generation
        """
        if not file_path:
            return None

        # Generate content hash if provided
        file_hash = None
        if file_content:
            file_hash = hashlib.md5(file_content.encode()).hexdigest()

        # Determine cluster ID based on time since last edit
        cluster_id = self._get_or_create_cluster_id()

        return {
            "file_path": file_path,
            "file_hash": file_hash,
            "operation_type": operation_type,
            "cluster_id": cluster_id,
            "captured_at": datetime.now(timezone.utc).isoformat()
        }

    def _get_or_create_cluster_id(self) -> str:
        """Get current cluster ID or create new one if timeout expired.

        Cluster IDs group files edited together within cluster_timeout window.
        """
        now = datetime.now(timezone.utc)

        if self._current_cluster is None:
            # First edit - start new cluster
            self._current_cluster = f"cluster_{now.strftime('%Y%m%d_%H%M%S')}"
            self._last_edit_time = now
        else:
            # Check if timeout expired
            if self._last_edit_time:
                elapsed = (now - self._last_edit_time).total_seconds()
                if elapsed > self.cluster_timeout:
                    # Timeout expired - start new cluster
                    self._current_cluster = f"cluster_{now.strftime('%Y%m%d_%H%M%S')}"

            self._last_edit_time = now

        return self._current_cluster

    async def capture_file_edit(self, file_path: str, operation_type: str = "edit", file_content: Optional[str] = None):
        """Convenience method to capture file edit operation."""
        await self.observe_and_record(
            file_path=file_path,
            operation_type=operation_type,
            file_content=file_content
        )

    async def capture_file_read(self, file_path: str):
        """Convenience method to capture file read operation."""
        await self.observe_and_record(file_path=file_path, operation_type="read")

    async def capture_file_write(self, file_path: str, file_content: Optional[str] = None):
        """Convenience method to capture file write operation."""
        await self.observe_and_record(file_path=file_path, operation_type="write", file_content=file_content)

    def reset_cluster(self):
        """Force start of new cluster on next capture.

        Useful for delineating distinct work sessions.
        """
        self._current_cluster = None
        self._last_edit_time = None
