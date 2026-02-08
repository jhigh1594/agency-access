"""
ObserverManager - Singleton access point for observers across all automation scripts.

Provides centralized observer access so all scripts share the same instances.
This is critical for consistent event capture across concurrent operations.
"""

from typing import Optional
from pathlib import Path
import logging

logger = logging.getLogger(__name__)


class ObserverManager:
    """Singleton manager for observer access across scripts.

    Usage:
        manager = ObserverManager()
        await manager.initialize(workspace_root)
        cmd_observer = manager.get_observer("command_usage")
        await cmd_observer.capture_command("/today")
    """

    _instance: Optional['ObserverManager'] = None
    _orchestrator: Optional['EventOrchestrator'] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        # Only initialize once (singleton pattern)
        if not hasattr(self, '_initialized'):
            self._orchestrator = None
            self._initialized = True

    async def initialize(self, workspace_root: Optional[Path] = None, config_path: Optional[str] = None):
        """Initialize orchestrator and all observers.

        Args:
            workspace_root: Path to workspace root (defaults to current working directory)
            config_path: Optional path to aipmos.yaml config file
        """
        if self._orchestrator is not None:
            # Already initialized
            return

        from .event_orchestrator import EventOrchestrator

        if config_path is None:
            if workspace_root is None:
                workspace_root = Path.cwd()
            config_path = str(workspace_root / ".aipmos" / "aipmos.yaml")

        self._orchestrator = EventOrchestrator(config_path, workspace_root)
        await self._orchestrator._collect_data()  # Initialize observers

        logger.info(f"ObserverManager initialized with {len(self._orchestrator.observers)} observers")

    def get_observer(self, observer_name: str):
        """Get observer instance by name.

        Args:
            observer_name: Name of observer ('command_usage', 'file_clusters', etc.)

        Returns:
            Observer instance or None if not found

        Raises:
            RuntimeError: If initialize() hasn't been called
        """
        if self._orchestrator is None:
            raise RuntimeError("ObserverManager not initialized. Call await initialize() first.")

        return self._orchestrator.get_observer(observer_name)

    @property
    def observers(self):
        """Get all observers dict."""
        if self._orchestrator is None:
            raise RuntimeError("ObserverManager not initialized. Call await initialize() first.")
        return self._orchestrator.observers

    async def get_event_statistics(self):
        """Get current event statistics from orchestrator."""
        if self._orchestrator is None:
            raise RuntimeError("ObserverManager not initialized. Call await initialize() first.")
        return await self._orchestrator._get_event_statistics()

    def reset(self):
        """Reset singleton (for testing purposes)."""
        self._orchestrator = None
        self._initialized = False


# Convenience function for quick access
async def get_observer(observer_name: str, workspace_root: Optional[Path] = None):
    """Quick access to observer by name.

    Usage:
        cmd_obs = await get_observer("command_usage")
        await cmd_obs.capture_command("/today")
    """
    manager = ObserverManager()
    await manager.initialize(workspace_root)
    return manager.get_observer(observer_name)
