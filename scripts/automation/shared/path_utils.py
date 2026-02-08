"""Path utilities for workspace resolution.

Centralizes path resolution logic using AIPMOS config.
"""

from pathlib import Path
from shared.aipmos_config import AIPMOSConfig


def get_project_root() -> Path:
    """Get workspace root from AIPMOS config.

    Returns:
        Path object pointing to workspace root directory
    """
    return AIPMOSConfig().workspace_root


def resolve_path(relative: str) -> Path:
    """Resolve path relative to project root.

    Args:
        relative: Relative path string (e.g., "tasks/today.md")

    Returns:
        Absolute Path object
    """
    # Normalize the path - strip leading/trailing slashes and spaces
    normalized = relative.strip().strip('/')
    return get_project_root() / normalized
