"""
Phase 4: Executive Intelligence & Proactive Synthesis - Data Models

This module defines data structures for executive-level strategic insights:
- WeeklySnapshot: Week-over-week comparison metrics
- TrendMetric: Single metric with trend direction
- ExecutiveAlert: Strategic alert for executive attention
- GoalCorrelation: Connection between patterns and OKRs
- ExecutiveInsightReport: Complete executive intelligence report

Design Principle: Statistical-first with graceful degradation. Works fully
without external AI, enhanced with Claude Code when available.
"""

from dataclasses import dataclass, field
from datetime import datetime, date
from enum import Enum
from typing import Any, Dict, List, Optional


class TrendDirection(Enum):
    """Direction of a metric trend."""
    UP = "up"
    DOWN = "down"
    STABLE = "stable"
    INSUFFICIENT_DATA = "insufficient_data"


class TrendSignificance(Enum):
    """Statistical significance of a trend."""
    SIGNIFICANT = "significant"  # >20% change or >1 std_dev
    NORMAL = "normal"  # Within expected variation
    INSUFFICIENT_DATA = "insufficient_data"


class AlertSeverity(Enum):
    """Severity level for executive alerts."""
    CRITICAL = "critical"  # >40% drop or major issue
    WARNING = "warning"  # 20-40% drop or emerging issue
    INFO = "info"  # <20% change or positive trend


class AlertCategory(Enum):
    """Categories of executive alerts."""
    PRODUCTIVITY = "productivity"  # Productivity score changes
    ALIGNMENT = "alignment"  # Strategic alignment changes
    PATTERN_CHANGE = "pattern_change"  # New high-confidence patterns
    OPPORTUNITY = "opportunity"  # Positive trends to leverage
    ANOMALY = "anomaly"  # Statistical anomalies detected


class ProgressIndicator(Enum):
    """Progress status for goal correlations."""
    ON_TRACK = "on_track"
    AT_RISK = "at_risk"
    BEHIND = "behind"
    UNKNOWN = "unknown"


@dataclass
class WeeklySnapshot:
    """Week-over-week comparison metrics.

    Captures the current week's state for trend analysis.
    Used to compare against previous weeks and detect changes.
    """
    period_start: date
    period_end: date
    total_events: int
    productivity_score: float  # 0.0-1.0 composite metric
    strategic_alignment_avg: float  # From today_cmd analysis
    top_patterns: List[str]  # Top 5 pattern identifiers
    anomalies_detected: int  # Count of statistical anomalies
    pattern_diversity: float = 0.0  # Unique pattern types / total patterns
    success_signal_rate: float = 0.0  # Success events / total events
    active_hours: int = 0  # Hours with activity this week

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for storage."""
        return {
            "period_start": self.period_start.isoformat(),
            "period_end": self.period_end.isoformat(),
            "total_events": self.total_events,
            "productivity_score": self.productivity_score,
            "strategic_alignment_avg": self.strategic_alignment_avg,
            "top_patterns": self.top_patterns,
            "anomalies_detected": self.anomalies_detected,
            "pattern_diversity": self.pattern_diversity,
            "success_signal_rate": self.success_signal_rate,
            "active_hours": self.active_hours
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "WeeklySnapshot":
        """Create from dictionary."""
        return cls(
            period_start=date.fromisoformat(data["period_start"]),
            period_end=date.fromisoformat(data["period_end"]),
            total_events=data["total_events"],
            productivity_score=data["productivity_score"],
            strategic_alignment_avg=data["strategic_alignment_avg"],
            top_patterns=data["top_patterns"],
            anomalies_detected=data["anomalies_detected"],
            pattern_diversity=data.get("pattern_diversity", 0.0),
            success_signal_rate=data.get("success_signal_rate", 0.0),
            active_hours=data.get("active_hours", 0)
        )


@dataclass
class TrendMetric:
    """Single metric with trend direction and significance.

    Tracks how a specific metric changes over time.
    """
    metric_name: str  # e.g., "productivity_score", "strategic_alignment"
    current_value: float
    previous_value: float
    change_percent: float
    trend_direction: TrendDirection
    significance: TrendSignificance
    z_score: float = 0.0  # Statistical z-score for anomaly detection
    data_points: int = 1  # Number of data points in trend

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for storage."""
        return {
            "metric_name": self.metric_name,
            "current_value": self.current_value,
            "previous_value": self.previous_value,
            "change_percent": self.change_percent,
            "trend_direction": self.trend_direction.value,
            "significance": self.significance.value,
            "z_score": self.z_score,
            "data_points": self.data_points
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "TrendMetric":
        """Create from dictionary."""
        return cls(
            metric_name=data["metric_name"],
            current_value=data["current_value"],
            previous_value=data["previous_value"],
            change_percent=data["change_percent"],
            trend_direction=TrendDirection(data["trend_direction"]),
            significance=TrendSignificance(data["significance"]),
            z_score=data.get("z_score", 0.0),
            data_points=data.get("data_points", 1)
        )


@dataclass
class ExecutiveAlert:
    """Strategic alert for executive attention.

    Generated when significant changes or anomalies are detected.
    """
    alert_id: str
    severity: AlertSeverity
    category: AlertCategory
    title: str
    description: str
    data_evidence: Dict[str, Any]  # Supporting data points
    suggested_actions: List[str]  # Actionable recommendations
    created_at: datetime
    acknowledged: bool = False
    threshold_triggered: Optional[float] = None  # Value that triggered alert

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for storage."""
        return {
            "alert_id": self.alert_id,
            "severity": self.severity.value,
            "category": self.category.value,
            "title": self.title,
            "description": self.description,
            "data_evidence": self.data_evidence,
            "suggested_actions": self.suggested_actions,
            "created_at": self.created_at.isoformat(),
            "acknowledged": self.acknowledged,
            "threshold_triggered": self.threshold_triggered
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "ExecutiveAlert":
        """Create from dictionary."""
        return cls(
            alert_id=data["alert_id"],
            severity=AlertSeverity(data["severity"]),
            category=AlertCategory(data["category"]),
            title=data["title"],
            description=data["description"],
            data_evidence=data["data_evidence"],
            suggested_actions=data["suggested_actions"],
            created_at=datetime.fromisoformat(data["created_at"]),
            acknowledged=data.get("acknowledged", False),
            threshold_triggered=data.get("threshold_triggered")
        )


@dataclass
class GoalCorrelation:
    """Connection between detected patterns and DPD OKRs.

    Maps user activity patterns to strategic objectives for alignment tracking.
    """
    okr_id: str  # e.g., "obj1", "obj2"
    okr_title: str  # Full objective title
    aligned_patterns: List[str]  # Pattern IDs related to this OKR
    alignment_score: float  # 0.0-1.0 correlation strength
    progress_indicator: ProgressIndicator  # ON_TRACK, AT_RISK, BEHIND
    recommendations: List[str]  # Strategic recommendations
    evidence_count: int = 0  # Number of data points supporting correlation
    last_activity: Optional[datetime] = None  # Most recent aligned activity

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for storage."""
        return {
            "okr_id": self.okr_id,
            "okr_title": self.okr_title,
            "aligned_patterns": self.aligned_patterns,
            "alignment_score": self.alignment_score,
            "progress_indicator": self.progress_indicator.value,
            "recommendations": self.recommendations,
            "evidence_count": self.evidence_count,
            "last_activity": self.last_activity.isoformat() if self.last_activity else None
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "GoalCorrelation":
        """Create from dictionary."""
        return cls(
            okr_id=data["okr_id"],
            okr_title=data["okr_title"],
            aligned_patterns=data["aligned_patterns"],
            alignment_score=data["alignment_score"],
            progress_indicator=ProgressIndicator(data["progress_indicator"]),
            recommendations=data["recommendations"],
            evidence_count=data.get("evidence_count", 0),
            last_activity=datetime.fromisoformat(data["last_activity"]) if data.get("last_activity") else None
        )


@dataclass
class ExecutiveInsightReport:
    """Complete executive intelligence report.

    Combines all Phase 4 analysis into a unified report for executives.
    """
    generated_at: datetime
    weekly_snapshot: WeeklySnapshot
    trend_metrics: List[TrendMetric]
    alerts: List[ExecutiveAlert]
    goal_correlations: List[GoalCorrelation]
    summary: str  # Executive briefing (3-5 bullet points)
    metadata: Dict[str, Any] = field(default_factory=dict)

    @property
    def critical_alerts(self) -> List[ExecutiveAlert]:
        """Get only critical alerts."""
        return [a for a in self.alerts if a.severity == AlertSeverity.CRITICAL]

    @property
    def warning_alerts(self) -> List[ExecutiveAlert]:
        """Get only warning alerts."""
        return [a for a in self.alerts if a.severity == AlertSeverity.WARNING]

    @property
    def significant_trends(self) -> List[TrendMetric]:
        """Get only significant trends."""
        return [t for t in self.trend_metrics if t.significance == TrendSignificance.SIGNIFICANT]

    @property
    def at_risk_goals(self) -> List[GoalCorrelation]:
        """Get goals that are behind or at risk."""
        return [g for g in self.goal_correlations
                if g.progress_indicator in [ProgressIndicator.AT_RISK, ProgressIndicator.BEHIND]]

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for storage."""
        return {
            "generated_at": self.generated_at.isoformat(),
            "weekly_snapshot": self.weekly_snapshot.to_dict(),
            "trend_metrics": [t.to_dict() for t in self.trend_metrics],
            "alerts": [a.to_dict() for a in self.alerts],
            "goal_correlations": [g.to_dict() for g in self.goal_correlations],
            "summary": self.summary,
            "metadata": self.metadata
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "ExecutiveInsightReport":
        """Create from dictionary."""
        return cls(
            generated_at=datetime.fromisoformat(data["generated_at"]),
            weekly_snapshot=WeeklySnapshot.from_dict(data["weekly_snapshot"]),
            trend_metrics=[TrendMetric.from_dict(t) for t in data["trend_metrics"]],
            alerts=[ExecutiveAlert.from_dict(a) for a in data["alerts"]],
            goal_correlations=[GoalCorrelation.from_dict(g) for g in data["goal_correlations"]],
            summary=data["summary"],
            metadata=data.get("metadata", {})
        )


# Helper functions for executive intelligence

def calculate_productivity_score(
    success_signals: int,
    total_events: int,
    avg_confidence: float,
    active_hours: int
) -> float:
    """Calculate composite productivity score.

    Formula: success_signals*0.4 + confidence*0.3 + activity_hours*0.3

    Args:
        success_signals: Count of successful outcomes
        total_events: Total events in period
        avg_confidence: Average pattern confidence
        active_hours: Hours with activity

    Returns:
        Productivity score from 0.0 to 1.0
    """
    if total_events == 0:
        return 0.0

    # Success rate (normalized)
    success_rate = min(1.0, success_signals / max(1, total_events))

    # Confidence component
    confidence_score = avg_confidence

    # Activity score (8 hours = full score, caps at 1.0)
    activity_score = min(1.0, active_hours / 8.0)

    # Weighted composite
    return (success_rate * 0.4 + confidence_score * 0.3 + activity_score * 0.3)


def calculate_change_percent(current: float, previous: float) -> float:
    """Calculate percentage change between two values.

    Args:
        current: Current value
        previous: Previous value

    Returns:
        Percentage change (positive = increase, negative = decrease)
    """
    if previous == 0:
        return 100.0 if current > 0 else 0.0
    return ((current - previous) / previous) * 100


def determine_trend_direction(change_percent: float, threshold: float = 5.0) -> TrendDirection:
    """Determine trend direction from percentage change.

    Args:
        change_percent: Percentage change
        threshold: Minimum change to consider significant (default 5%)

    Returns:
        TrendDirection enum value
    """
    if abs(change_percent) < threshold:
        return TrendDirection.STABLE
    return TrendDirection.UP if change_percent > 0 else TrendDirection.DOWN


def calculate_z_score(value: float, mean: float, std_dev: float) -> float:
    """Calculate z-score for anomaly detection.

    Formula: (value - mean) / std_dev

    Args:
        value: Current value
        mean: Historical mean
        std_dev: Historical standard deviation

    Returns:
        Z-score (negative = below mean, positive = above mean)
    """
    if std_dev == 0:
        return 0.0
    return (value - mean) / std_dev


def is_significant_change(change_percent: float, z_score: float) -> TrendSignificance:
    """Determine if a change is statistically significant.

    Args:
        change_percent: Percentage change
        z_score: Z-score for the change

    Returns:
        TrendSignificance enum value
    """
    # Significant if >20% change OR |z-score| > 1.0
    if abs(change_percent) > 20.0 or abs(z_score) > 1.0:
        return TrendSignificance.SIGNIFICANT
    return TrendSignificance.NORMAL


def generate_alert_id() -> str:
    """Generate a unique alert ID.

    Returns:
        Unique alert identifier (e.g., "alert_20250130_143052")
    """
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    return f"alert_{timestamp}"
