"""
Phase 4: Executive Intelligence - Trend Analyzer

Analyzes patterns across time windows for trends and anomalies.
Provides week-over-week comparisons and statistical anomaly detection.

Key Methods:
- analyze_weekly_trends(): Compare current week against previous weeks
- detect_anomalies(): Detect statistical anomalies using z-score analysis
- generate_weekly_snapshot(): Create current week summary for comparison
"""

import asyncio
import logging
from datetime import date, datetime, timedelta
from pathlib import Path
from statistics import mean, stdev
from typing import Any, Dict, List, Optional, Tuple

import aiosqlite

from .pattern_models import PatternReport
from .executive_models import (
    WeeklySnapshot,
    TrendMetric,
    TrendDirection,
    TrendSignificance,
    calculate_productivity_score,
    calculate_change_percent,
    determine_trend_direction,
    is_significant_change,
    calculate_z_score,
)

logger = logging.getLogger(__name__)


class TrendAnalyzer:
    """Analyzes patterns across time windows for trends and anomalies.

    Uses statistical methods to identify:
    - Week-over-week changes in key metrics
    - Significant trends (increasing/decreasing patterns)
    - Statistical anomalies using z-score analysis
    """

    # Default configuration
    DEFAULT_WEEKS_BACK = 4
    DEFAULT_ANOMALY_THRESHOLD = 2.0  # Z-score threshold

    def __init__(
        self,
        db_path: str,
        workspace_root: Path,
        config: Optional[Dict[str, Any]] = None
    ):
        """Initialize the trend analyzer.

        Args:
            db_path: Path to events.db for event data
            workspace_root: Workspace root directory
            config: Optional configuration dictionary
        """
        self.db_path = db_path
        self.workspace_root = workspace_root
        self.config = config or {}

        # Configuration
        self.weeks_back = self.config.get(
            "trend_analysis",
            {}
        ).get("weeks_back", self.DEFAULT_WEEKS_BACK)

        self.anomaly_threshold = self.config.get(
            "trend_analysis",
            {}
        ).get("anomaly_threshold_stddev", self.DEFAULT_ANOMALY_THRESHOLD)

    async def analyze_weekly_trends(
        self,
        current_report: PatternReport,
        previous_snapshots: List[WeeklySnapshot]
    ) -> List[TrendMetric]:
        """Compare current week against previous weeks.

        Analyzes these metrics:
        - Productivity score (events per active hour)
        - Strategic alignment (from today_cmd)
        - Pattern diversity (unique patterns detected)
        - Success signal rate (git commits, completions)

        Args:
            current_report: Current PatternReport
            previous_snapshots: Previous weekly snapshots

        Returns:
            List of TrendMetric objects with week-over-week changes
        """
        logger.info("Analyzing weekly trends...")

        # Generate current snapshot
        current_snapshot = await self.generate_weekly_snapshot(current_report)
        metrics = []

        if not previous_snapshots:
            logger.warning("No previous snapshots for trend comparison")
            return metrics

        # Calculate previous week averages
        prev_snapshot = previous_snapshots[0]  # Most recent previous week

        # Productivity score trend
        productivity_metric = self._calculate_metric_trend(
            "productivity_score",
            current_snapshot.productivity_score,
            prev_snapshot.productivity_score,
            [s.productivity_score for s in previous_snapshots]
        )
        metrics.append(productivity_metric)

        # Strategic alignment trend
        alignment_metric = self._calculate_metric_trend(
            "strategic_alignment",
            current_snapshot.strategic_alignment_avg,
            prev_snapshot.strategic_alignment_avg,
            [s.strategic_alignment_avg for s in previous_snapshots if s.strategic_alignment_avg > 0]
        )
        metrics.append(alignment_metric)

        # Pattern diversity trend
        diversity_metric = self._calculate_metric_trend(
            "pattern_diversity",
            current_snapshot.pattern_diversity,
            prev_snapshot.pattern_diversity,
            [s.pattern_diversity for s in previous_snapshots if s.pattern_diversity > 0]
        )
        metrics.append(diversity_metric)

        # Success signal rate trend
        success_metric = self._calculate_metric_trend(
            "success_rate",
            current_snapshot.success_signal_rate,
            prev_snapshot.success_signal_rate,
            [s.success_signal_rate for s in previous_snapshots if s.success_signal_rate > 0]
        )
        metrics.append(success_metric)

        # Active hours trend
        hours_metric = self._calculate_metric_trend(
            "active_hours",
            current_snapshot.active_hours,
            prev_snapshot.active_hours,
            [s.active_hours for s in previous_snapshots if s.active_hours > 0]
        )
        metrics.append(hours_metric)

        logger.info(f"Generated {len(metrics)} trend metrics")
        return metrics

    async def detect_anomalies(
        self,
        current_report: PatternReport,
        previous_snapshots: List[WeeklySnapshot],
        threshold_stddev: float = 2.0
    ) -> List[Dict[str, Any]]:
        """Detect statistical anomalies using z-score analysis.

        Identifies values that deviate significantly from historical norms.

        Args:
            current_report: Current PatternReport
            previous_snapshots: Historical snapshots for baseline
            threshold_stddev: Z-score threshold for anomaly detection

        Returns:
            List of anomaly dictionaries with details
        """
        logger.info("Detecting anomalies...")

        anomalies = []

        if len(previous_snapshots) < 2:
            logger.warning("Insufficient historical data for anomaly detection")
            return anomalies

        # Generate current snapshot
        current_snapshot = await self.generate_weekly_snapshot(current_report)

        # Check each metric for anomalies
        metrics_to_check = [
            ("productivity_score", current_snapshot.productivity_score),
            ("strategic_alignment", current_snapshot.strategic_alignment_avg),
            ("pattern_diversity", current_snapshot.pattern_diversity),
            ("success_rate", current_snapshot.success_signal_rate),
            ("active_hours", current_snapshot.active_hours),
        ]

        for metric_name, current_value in metrics_to_check:
            # Build historical baseline
            historical_values = []
            for snapshot in previous_snapshots:
                if metric_name == "productivity_score":
                    val = snapshot.productivity_score
                elif metric_name == "strategic_alignment":
                    val = snapshot.strategic_alignment_avg
                elif metric_name == "pattern_diversity":
                    val = snapshot.pattern_diversity
                elif metric_name == "success_rate":
                    val = snapshot.success_signal_rate
                else:  # active_hours
                    val = snapshot.active_hours

                if val > 0:  # Only use valid values
                    historical_values.append(val)

            if len(historical_values) < 2:
                continue

            # Calculate z-score
            hist_mean = mean(historical_values)
            try:
                hist_stddev = stdev(historical_values)
            except:  # Not enough variation
                hist_stddev = 0.1  # Small default

            z_score = calculate_z_score(current_value, hist_mean, hist_stddev)

            # Check if anomaly
            if abs(z_score) >= threshold_stddev:
                anomaly_type = "high" if z_score > 0 else "low"
                anomalies.append({
                    "metric_name": metric_name,
                    "current_value": current_value,
                    "historical_mean": hist_mean,
                    "historical_stddev": hist_stddev,
                    "z_score": z_score,
                    "anomaly_type": anomaly_type,
                    "severity": "critical" if abs(z_score) >= threshold_stddev * 1.5 else "warning",
                    "description": self._format_anomaly_description(
                        metric_name, current_value, hist_mean, z_score
                    )
                })

        logger.info(f"Detected {len(anomalies)} anomalies")
        return anomalies

    async def generate_weekly_snapshot(
        self,
        pattern_report: PatternReport,
        time_active_minutes: int = 0
    ) -> WeeklySnapshot:
        """Create current week summary for comparison.

        Args:
            pattern_report: PatternReport with current patterns
            time_active_minutes: Minutes of active time this week

        Returns:
            WeeklySnapshot with current week's metrics
        """
        today = date.today()
        # Calculate week start (Monday) and end (Sunday)
        days_since_monday = today.weekday()
        period_start = today - timedelta(days=days_since_monday)
        period_end = period_start + timedelta(days=6)

        # Extract metrics from pattern report
        total_events = (
            len(pattern_report.command_sequences) +
            len(pattern_report.file_clusters) +
            len(pattern_report.success_correlations)
        )

        # Calculate productivity score
        success_count = len(pattern_report.success_correlations)
        avg_confidence = (
            sum(seq.confidence for seq in pattern_report.command_sequences) /
            max(1, len(pattern_report.command_sequences))
        )
        active_hours = max(1, time_active_minutes // 60)

        productivity_score = calculate_productivity_score(
            success_count,
            total_events,
            avg_confidence,
            active_hours
        )

        # Get strategic alignment from today_cmd if available
        strategic_alignment = await self._get_strategic_alignment()

        # Calculate pattern diversity
        pattern_types = set()
        if pattern_report.command_sequences:
            pattern_types.add("command_sequences")
        if pattern_report.file_clusters:
            pattern_types.add("file_clusters")
        if pattern_report.success_correlations:
            pattern_types.add("success_correlations")
        if pattern_report.time_patterns:
            pattern_types.add("time_patterns")

        pattern_diversity = (
            len(pattern_types) / max(1, len([
                "command_sequences", "file_clusters",
                "success_correlations", "time_patterns"
            ]))
        )

        # Calculate success signal rate
        success_signal_rate = (
            success_count / max(1, total_events)
        )

        # Get top patterns
        top_patterns = []
        for seq in pattern_report.command_sequences[:3]:
            top_patterns.append(f"seq:{'→'.join(seq.sequence)}")
        for cluster in pattern_report.file_clusters[:2]:
            top_patterns.append(f"cluster:{cluster.cluster_id}")

        return WeeklySnapshot(
            period_start=period_start,
            period_end=period_end,
            total_events=total_events,
            productivity_score=productivity_score,
            strategic_alignment_avg=strategic_alignment,
            top_patterns=top_patterns[:5],
            anomalies_detected=0,  # Will be updated by detect_anomalies
            pattern_diversity=pattern_diversity,
            success_signal_rate=success_signal_rate,
            active_hours=active_hours
        )

    def _calculate_metric_trend(
        self,
        metric_name: str,
        current_value: float,
        previous_value: float,
        historical_values: List[float]
    ) -> TrendMetric:
        """Calculate trend for a single metric.

        Args:
            metric_name: Name of the metric
            current_value: Current week's value
            previous_value: Previous week's value
            historical_values: Historical values for significance testing

        Returns:
            TrendMetric with direction and significance
        """
        # Calculate percent change
        change_percent = calculate_change_percent(current_value, previous_value)

        # Determine trend direction
        trend_direction = determine_trend_direction(change_percent)

        # Calculate z-score for significance
        if len(historical_values) >= 2:
            hist_mean = mean(historical_values)
            try:
                hist_stddev = stdev(historical_values)
            except:  # No variation
                hist_stddev = 0.1
            z_score = calculate_z_score(current_value, hist_mean, hist_stddev)
        else:
            z_score = 0.0

        # Determine significance
        significance = is_significant_change(change_percent, z_score)

        return TrendMetric(
            metric_name=metric_name,
            current_value=current_value,
            previous_value=previous_value,
            change_percent=change_percent,
            trend_direction=trend_direction,
            significance=significance,
            z_score=z_score,
            data_points=len(historical_values) + 1
        )

    def _format_anomaly_description(
        self,
        metric_name: str,
        current_value: float,
        historical_mean: float,
        z_score: float
    ) -> str:
        """Format a human-readable anomaly description.

        Args:
            metric_name: Name of the anomalous metric
            current_value: Current value
            historical_mean: Historical average
            z_score: Calculated z-score

        Returns:
            Human-readable description
        """
        direction = "higher" if z_score > 0 else "lower"
        magnitude = abs(z_score)

        metric_display = metric_name.replace("_", " ").title()

        if magnitude >= 3.0:
            severity = "extremely"
        elif magnitude >= 2.0:
            severity = "significantly"
        else:
            severity = "notably"

        deviation_pct = abs((current_value - historical_mean) / max(0.01, historical_mean)) * 100

        return (
            f"{metric_display} is {severity} {direction} than normal "
            f"({current_value:.2f} vs {historical_mean:.2f} historical avg, "
            f"{deviation_pct:.0f}% deviation)"
        )

    async def _get_strategic_alignment(self) -> float:
        """Get strategic alignment score from today_cmd analysis.

        Attempts to read recent daily plan analysis to extract
        strategic alignment scores.

        Returns:
            Alignment score from 0.0 to 1.0, or 0.0 if unavailable
        """
        try:
            # Look for recent analyzed_data from today_cmd
            plans_path = self.workspace_root / "memory-bank" / "daily-plans"

            if not plans_path.exists():
                return 0.0

            # Find most recent analysis file
            analysis_files = list(plans_path.glob("*_analyzed.json"))

            if not analysis_files:
                return 0.0

            # Get most recent
            latest_file = max(analysis_files, key=lambda p: p.stat().st_mtime)

            import json
            data = json.loads(latest_file.read_text())

            # Extract strategic alignment scores
            # Today_cmd stores this in the analysis results
            alignment_scores = []

            # Look for tasks with strategic_alignment field
            for section in data.get("sections", []):
                for task in section.get("tasks", []):
                    if "strategic_alignment" in task:
                        try:
                            score = float(task["strategic_alignment"])
                            alignment_scores.append(score)
                        except (ValueError, TypeError):
                            pass

            if alignment_scores:
                return mean(alignment_scores)

            return 0.0

        except Exception as e:
            logger.debug(f"Could not load strategic alignment: {e}")
            return 0.0

    async def get_historical_metric_values(
        self,
        metric_name: str,
        weeks_back: int = 4
    ) -> List[float]:
        """Get historical values for a specific metric.

        Args:
            metric_name: Name of metric to retrieve
            weeks_back: Number of weeks to look back

        Returns:
            List of historical values
        """
        try:
            from .pattern_store import PatternStore

            store = PatternStore(self.workspace_root)
            snapshots = await store.get_recent_snapshots(weeks_back)

            values = []
            for snapshot in snapshots:
                if metric_name == "productivity_score":
                    values.append(snapshot.productivity_score)
                elif metric_name == "strategic_alignment":
                    if snapshot.strategic_alignment_avg > 0:
                        values.append(snapshot.strategic_alignment_avg)
                elif metric_name == "pattern_diversity":
                    if snapshot.pattern_diversity > 0:
                        values.append(snapshot.pattern_diversity)
                elif metric_name == "success_rate":
                    if snapshot.success_signal_rate > 0:
                        values.append(snapshot.success_signal_rate)
                elif metric_name == "active_hours":
                    if snapshot.active_hours > 0:
                        values.append(snapshot.active_hours)

            return values

        except Exception as e:
            logger.error(f"Failed to get historical values: {e}")
            return []

    async def calculate_moving_average(
        self,
        values: List[float],
        window: int = 3
    ) -> List[float]:
        """Calculate moving average for smoothing trends.

        Args:
            values: List of values
            window: Window size for moving average

        Returns:
            List of smoothed values
        """
        if len(values) < window:
            return values

        smoothed = []
        for i in range(len(values) - window + 1):
            window_avg = mean(values[i:i + window])
            smoothed.append(window_avg)

        return smoothed

    def get_baseline_metrics(self, snapshots: List[WeeklySnapshot]) -> Dict[str, Dict[str, float]]:
        """Calculate baseline statistics from historical snapshots.

        Args:
            snapshots: Historical weekly snapshots

        Returns:
            Dictionary with baseline stats for each metric
        """
        baselines = {}

        metrics = [
            ("productivity_score", lambda s: s.productivity_score),
            ("strategic_alignment", lambda s: s.strategic_alignment_avg),
            ("pattern_diversity", lambda s: s.pattern_diversity),
            ("success_rate", lambda s: s.success_signal_rate),
            ("active_hours", lambda s: s.active_hours),
        ]

        for metric_name, extractor in metrics:
            values = [extractor(s) for s in snapshots if extractor(s) > 0]

            if values:
                baselines[metric_name] = {
                    "mean": mean(values),
                    "min": min(values),
                    "max": max(values),
                    "count": len(values)
                }
                try:
                    baselines[metric_name]["stddev"] = stdev(values)
                except:  # No variation
                    baselines[metric_name]["stddev"] = 0.0

        return baselines
