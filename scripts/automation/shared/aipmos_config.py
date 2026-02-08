"""AIPMOS configuration loader with workspace discovery."""

import os
from pathlib import Path
from typing import Any, Dict, Optional
import yaml
from dotenv import load_dotenv


class AIPMOSConfig:
    """Configuration manager for AIPMOS workspace.

    Discovers workspace root by searching upward for .aipmos directory,
    loads configuration from aipmos.yaml, and resolves paths.
    """

    def __init__(self, start_path: Optional[Path] = None) -> None:
        """Initialize configuration by discovering workspace.

        Args:
            start_path: Starting directory for workspace search.
                       Defaults to current working directory.

        Raises:
            RuntimeError: If no .aipmos directory found.
        """
        self._workspace_root = self._discover_workspace(start_path or Path.cwd())
        self._config = self._load_config()
        self._env_vars = self._load_env_vars()

    def _discover_workspace(self, start_path: Path) -> Path:
        """Search upward for .aipmos directory.

        Args:
            start_path: Directory to start searching from.

        Returns:
            Path containing .aipmos directory.

        Raises:
            RuntimeError: If no .aipmos directory found.
        """
        current = start_path.resolve()

        while True:
            aipmos_marker = current / ".aipmos"
            if aipmos_marker.exists() and aipmos_marker.is_dir():
                return current

            parent = current.parent
            if parent == current:  # Reached filesystem root
                break
            current = parent

        raise RuntimeError(
            f"AIPMOS workspace not found. "
            f"Searched upward from {start_path}. "
            f"Create .aipmos directory to initialize workspace."
        )

    def _load_config(self) -> Dict[str, Any]:
        """Load configuration from aipmos.yaml.

        Returns:
            Configuration dictionary with defaults.
        """
        config_file = self._workspace_root / ".aipmos" / "aipmos.yaml"

        defaults = {
            "version": "1.0.0",
            "workspace": {
                "name": "Default Workspace",
                "type": "product-management",
            },
            "paths": {
                "memory_bank": "memory-bank",
                "tasks_output": "tasks",
                "scripts": "scripts/automation",
                "product_content": "Products",
                "daily_plans": "memory-bank/daily-plans",
                "meeting_notes": "Product-Management/granola",
                "specstory_history": ".specstory/history",
            },
            "context": {
                "company_name": "Planview",
                "primary_product": "AgilePlace",
            },
            "integrations": {
                "agileplace": {
                    "enabled": True,
                    "domain": "planview.leankit.com",
                    "user_ids": [],
                },
            },
            "memory_maintenance": {
                "enabled": True,
                "archive": {
                    "threshold_days": 90,
                    "archive_path": "memory-bank/archive",
                },
                "update_frequencies": {
                    "high": 7,
                    "medium": 30,
                    "low": 90,
                },
                "contradiction_detection": {
                    "enabled": True,
                    "confidence_threshold": 0.7,
                },
            },
        }

        if config_file.exists():
            with open(config_file, "r") as f:
                user_config = yaml.safe_load(f) or {}
                # Merge user config with defaults (user takes precedence)
                return self._deep_merge(defaults, user_config)

        return defaults

    def _deep_merge(self, base: Dict, update: Dict) -> Dict:
        """Deep merge two dictionaries.

        Args:
            base: Base dictionary with defaults.
            update: Dictionary with user values.

        Returns:
            Merged dictionary.
        """
        result = base.copy()
        for key, value in update.items():
            if key in result and isinstance(result[key], dict) and isinstance(value, dict):
                result[key] = self._deep_merge(result[key], value)
            else:
                result[key] = value
        return result

    def _load_env_vars(self) -> Dict[str, str]:
        """Load environment variables from .aipmos/environment.

        Returns:
            Dictionary of environment variables.
        """
        env_file = self._workspace_root / ".aipmos" / "environment"
        result = {}

        if env_file.exists():
            load_dotenv(env_file, override=True)
            # Read the file directly to capture all variables
            with open(env_file, "r") as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        key, value = line.split("=", 1)
                        result[key.strip()] = value.strip()

        return result

    @property
    def workspace_root(self) -> Path:
        """Get workspace root path."""
        return self._workspace_root

    @property
    def config(self) -> Dict[str, Any]:
        """Get full configuration dictionary."""
        return self._config

    @property
    def paths(self) -> Dict[str, Path]:
        """Get all configured paths resolved to absolute paths."""
        path_config = self._config.get("paths", {})
        return {
            key: self._workspace_root / value
            for key, value in path_config.items()
        }

    def get_env(self, key: str, default: Any = None) -> Any:
        """Get environment variable from multiple sources.

        Search order:
        1. System environment variables
        2. .aipmos/environment file
        3. Provided default

        Args:
            key: Environment variable name.
            default: Default value if not found.

        Returns:
            Environment variable value or default.
        """
        # Check system environment first
        if key in os.environ:
            return os.environ[key]

        # Check .aipmos/environment file
        if key in self._env_vars:
            return self._env_vars[key]

        return default

    def get(self, path: str, default: Any = None) -> Any:
        """Get nested config value using dot notation.

        Args:
            path: Dot-separated path (e.g., 'workspace.name').
            default: Default value if path not found.

        Returns:
            Configuration value or default.
        """
        keys = path.split(".")
        value = self._config

        for key in keys:
            if isinstance(value, dict) and key in value:
                value = value[key]
            else:
                return default

        return value
