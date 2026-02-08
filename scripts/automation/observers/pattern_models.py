"""
Data models for pattern detection and insight system.

Defines the core data structures used throughout Phase 2:
- PatternReport: Complete analysis result
- CommandSequence: Detected command chains
- FileCluster: Files edited together
- TimePatternSummary: Productivity time patterns
- SuccessCorrelation: Activity → outcome links
- InsightReport: Formatted insights for display
"""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Dict, List, Optional


@dataclass
class CommandSequence:
    """A detected command sequence pattern.

    Example: ["/brainstorm", "/today", "/commit"]
    Indicates a common workflow pattern.
    """
    sequence: List[str]
    occurrence_count: int
    avg_duration_ms: int
    confidence: float  # 0.0 to 1.0

    def __str__(self) -> str:
        return " → ".join(self.sequence)


@dataclass
class FileCluster:
    """Files commonly edited together.

    Detected using co-occurrence analysis and Jaccard similarity.
    """
    files: List[str]
    co_occurrence_count: int
    jaccard_similarity: float  # 0.0 to 1.0
    cluster_id: str

    def __str__(self) -> str:
        return f"{self.cluster_id}: {', '.join(self.files[:3])}{'...' if len(self.files) > 3 else ''}"


@dataclass
class TimePatternSummary:
    """Time-based productivity patterns."""
    peak_hours: List[int]  # Hours with most activity (0-23)
    peak_days: List[int]  # Days with most activity (0=Monday, 6=Sunday)
    avg_session_duration_minutes: float
    session_count_by_hour: Dict[int, int]  # Hour → session count
    most_productive_hour: Optional[int] = None

    @property
    def peak_hours_display(self) -> str:
        """Human-readable peak hours."""
        if not self.peak_hours:
            return "No data"
        ranges = []
        start = self.peak_hours[0]
        prev = start
        for h in self.peak_hours[1:]:
            if h != prev + 1:
                ranges.append(f"{start}-{prev}" if start != prev else f"{start}")
                start = h
            prev = h
        ranges.append(f"{start}-{prev}" if start != prev else f"{start}")
        return ", ".join(ranges)


@dataclass
class SuccessCorrelation:
    """Correlation between activities and successful outcomes."""
    activity_type: str  # e.g., "command_usage", "file_edit"
    activity_pattern: str  # e.g., "/today", "memory.md"
    outcome_type: str  # e.g., "git_commit", "task_complete"
    correlation_strength: float  # 0.0 to 1.0
    sample_size: int
    time_window_minutes: int

    def __str__(self) -> str:
        return f"{self.activity_pattern} → {self.outcome_type} (r={self.correlation_strength:.2f})"


@dataclass
class PatternReport:
    """Complete pattern analysis report.

    Returned by PatternAnalyzer.analyze_all_patterns().
    Contains all detected patterns from the analysis period.
    """
    command_sequences: List[CommandSequence] = field(default_factory=list)
    file_clusters: List[FileCluster] = field(default_factory=list)
    time_patterns: Optional[TimePatternSummary] = None
    success_correlations: List[SuccessCorrelation] = field(default_factory=list)
    analysis_timestamp: str = field(default_factory=lambda: datetime.now().isoformat())
    confidence: float = 0.5  # Overall confidence in patterns

    @property
    def pattern_count(self) -> int:
        """Total number of patterns detected."""
        return (
            len(self.command_sequences) +
            len(self.file_clusters) +
            len(self.success_correlations) +
            (1 if self.time_patterns else 0)
        )

    def has_patterns(self) -> bool:
        """Check if any patterns were detected."""
        return self.pattern_count > 0


@dataclass
class InsightReport:
    """Formatted pattern insights for display and Claude Code interpretation.

    Returned by InsightGenerator.generate_insights().
    Contains both statistical patterns and formatted summaries.
    """
    statistical_patterns: Dict[str, Any]  # Raw pattern data
    formatted_summary: str  # Markdown-formatted for display
    claude_code_prompt: str  # Ready for Claude Code interpretation
    generated_at: str = field(default_factory=lambda: datetime.now().isoformat())

    @property
    def insight_count(self) -> int:
        """Count of insight categories populated."""
        categories = []
        if self.statistical_patterns.get("command_sequences"):
            categories.append("command_sequences")
        if self.statistical_patterns.get("file_clusters"):
            categories.append("file_clusters")
        if self.statistical_patterns.get("time_patterns"):
            categories.append("time_patterns")
        if self.statistical_patterns.get("success_correlations"):
            categories.append("success_correlations")
        return len(categories)


@dataclass
class PatternHistory:
    """Historical pattern tracking for trend analysis.

    Stored in patterns.db for long-term pattern evolution.
    """
    pattern_type: str  # 'command_sequence', 'file_cluster', etc.
    pattern_key: str  # Unique identifier
    pattern_data: str  # JSON with pattern details
    confidence: float
    first_seen: str
    last_seen: str
    occurrence_count: int

    @classmethod
    def from_row(cls, row: tuple) -> "PatternHistory":
        """Create from database row."""
        return cls(
            pattern_type=row[0],
            pattern_key=row[1],
            pattern_data=row[2],
            confidence=row[3],
            first_seen=row[4],
            last_seen=row[5],
            occurrence_count=row[6]
        )


@dataclass
class PatternAggregation:
    """Aggregated pattern statistics over time windows.

    Used for weekly/monthly summaries.
    """
    aggregation_type: str  # 'weekly', 'monthly'
    period_start: str
    period_end: str
    total_patterns_detected: int
    top_command_sequences: List[Dict[str, Any]]
    top_file_clusters: List[Dict[str, Any]]
    productivity_score: float  # Composite productivity metric


# Helper functions for pattern analysis

def calculate_jaccard_similarity(set1: set, set2: set) -> float:
    """Calculate Jaccard similarity between two sets.

    J(A,B) = |A ∩ B| / |A ∪ B|

    Args:
        set1: First set
        set2: Second set

    Returns:
        Similarity score from 0.0 (no overlap) to 1.0 (identical)
    """
    if not set1 or not set2:
        return 0.0
    intersection = len(set1 & set2)
    union = len(set1 | set2)
    return intersection / union if union > 0 else 0.0


def normalize_confidence(raw_score: float, min_samples: int = 3) -> float:
    """Normalize a confidence score based on sample size.

    Applies a sigmoid-like adjustment for small sample sizes.

    Args:
        raw_score: Raw confidence score (0.0 to 1.0)
        min_samples: Minimum samples for full confidence

    Returns:
        Adjusted confidence score
    """
    # Simple adjustment: reduce confidence for small samples
    # This could be made more sophisticated
    return min(raw_score, 1.0)  # Placeholder for now


def format_duration(minutes: float) -> str:
    """Format duration in human-readable format."""
    if minutes < 1:
        return f"{int(minutes * 60)}s"
    elif minutes < 60:
        return f"{int(minutes)}m"
    else:
        hours = int(minutes // 60)
        mins = int(minutes % 60)
        return f"{hours}h {mins}m" if mins else f"{hours}h"
