"""
Phase 4: Executive Intelligence - Executive Synthesizer

Generates executive intelligence reports from all Phase 4 components.

Key Methods:
- generate_executive_report(): Combine trends, alerts, and goals into unified report
- format_for_memory_md(): Format executive insights for memory.md insertion
- _generate_executive_summary(): Create 3-5 bullet executive briefing
"""

import asyncio
import logging
from datetime import datetime, date
from pathlib import Path
from typing import Any, Dict, List, Optional

from .pattern_models import PatternReport
from .prediction_models import PredictionReport
from .executive_models import (
    ExecutiveInsightReport,
    WeeklySnapshot,
    TrendMetric,
    ExecutiveAlert,
    GoalCorrelation,
)
from .trend_analyzer import TrendAnalyzer
from .alert_system import AlertSystem
from .goal_recommender import GoalAwareRecommender

logger = logging.getLogger(__name__)


class ExecutiveSynthesizer:
    """Generates executive intelligence reports from all Phase 4 components.

    Combines:
    - TrendAnalyzer: Week-over-week analysis
    - AlertSystem: Strategic alerts
    - GoalAwareRecommender: OKR correlations

    Performance target: Full synthesis <5 seconds using parallel async.
    """

    # Performance targets
    MAX_SYNTHESIS_TIME_SECONDS = 5.0
    MAX_EXECUTIVE_SECTION_LINES = 60

    def __init__(self, workspace_root: Path, config: Optional[Dict[str, Any]] = None):
        """Initialize the executive synthesizer.

        Args:
            workspace_root: Path to workspace root directory
            config: Optional configuration dictionary
        """
        self.workspace_root = workspace_root
        self.config = config or {}

        # Initialize components
        db_path = str(workspace_root / ".aipmos" / "events.db")

        self.trend_analyzer = TrendAnalyzer(
            db_path=db_path,
            workspace_root=workspace_root,
            config=config
        )

        self.alert_system = AlertSystem(config=config)

        self.goal_recommender = GoalAwareRecommender(
            workspace_root=workspace_root,
            config=config
        )

        # Configuration
        exec_config = self.config.get("executive_intelligence", {})
        self.enabled = exec_config.get("enabled", True)

        logger.info(f"ExecutiveSynthesizer initialized (enabled: {self.enabled})")

    async def generate_executive_report(
        self,
        pattern_report: PatternReport,
        prediction_report: Optional[PredictionReport] = None,
        recent_analysis: Optional[Any] = None
    ) -> ExecutiveInsightReport:
        """Generate complete executive intelligence report.

        Pipeline:
        1. Analyze weekly trends (TrendAnalyzer)
        2. Detect anomalies (TrendAnalyzer)
        3. Generate alerts (AlertSystem)
        4. Correlate to goals (GoalAwareRecommender)
        5. Synthesize executive summary

        Uses parallel async execution for performance.

        Args:
            pattern_report: PatternReport with current patterns
            prediction_report: Optional PredictionReport
            recent_analysis: Optional AnalyzedData from today_cmd

        Returns:
            ExecutiveInsightReport with complete intelligence
        """
        if not self.enabled:
            logger.debug("Executive intelligence disabled")
            return self._empty_report()

        start_time = datetime.now()
        logger.info("Generating executive intelligence report...")

        # Get previous snapshots for comparison
        from .pattern_store import PatternStore
        store = PatternStore(self.workspace_root)
        await store.initialize()
        previous_snapshots = await store.get_recent_snapshots(weeks_back=4)

        # Generate current snapshot
        current_snapshot = await self.trend_analyzer.generate_weekly_snapshot(
            pattern_report
        )

        # Run analysis in parallel for performance
        trends_task = self.trend_analyzer.analyze_weekly_trends(
            pattern_report,
            previous_snapshots
        )

        anomalies_task = self.trend_analyzer.detect_anomalies(
            pattern_report,
            previous_snapshots
        )

        goals_task = self.goal_recommender.correlate_patterns_to_goals(
            pattern_report,
            recent_analysis
        )

        # Execute in parallel
        trends, anomalies, goal_correlations = await asyncio.gather(
            trends_task,
            anomalies_task,
            goals_task,
            return_exceptions=True
        )

        # Handle exceptions
        if isinstance(trends, Exception):
            logger.error(f"Trend analysis failed: {trends}")
            trends = []

        if isinstance(anomalies, Exception):
            logger.error(f"Anomaly detection failed: {anomalies}")
            anomalies = []

        if isinstance(goal_correlations, Exception):
            logger.error(f"Goal correlation failed: {goal_correlations}")
            goal_correlations = []

        # Update snapshot with anomaly count
        current_snapshot.anomalies_detected = len(anomalies)

        # Generate alerts from trends and anomalies
        alerts = await self.alert_system.generate_alerts(
            trends,
            anomalies,
            pattern_report
        )

        # Generate executive summary
        summary = self._generate_executive_summary(
            current_snapshot,
            trends,
            alerts,
            goal_correlations
        )

        # Create report
        report = ExecutiveInsightReport(
            generated_at=datetime.now(),
            weekly_snapshot=current_snapshot,
            trend_metrics=trends,
            alerts=alerts,
            goal_correlations=goal_correlations,
            summary=summary,
            metadata={
                "synthesis_time_seconds": (datetime.now() - start_time).total_seconds(),
                "previous_snapshots_count": len(previous_snapshots),
                "pattern_report_timestamp": pattern_report.analysis_timestamp
            }
        )

        elapsed = (datetime.now() - start_time).total_seconds()
        logger.info(
            f"Executive report generated in {elapsed:.2f}s: "
            f"{len(trends)} trends, {len(alerts)} alerts, "
            f"{len(goal_correlations)} goal correlations"
        )

        return report

    async def format_for_memory_md(self, report: ExecutiveInsightReport) -> str:
        """Format executive insights for memory.md insertion.

        Creates a concise section suitable for memory.md with:
        - Weekly summary (3-4 bullets)
        - Critical/warning alerts only
        - Top 3 goal correlations

        Max 60 lines total to prevent bloat.

        Args:
            report: ExecutiveInsightReport to format

        Returns:
            Markdown-formatted section for memory.md
        """
        lines = [
            "## Executive Insights",
            "",
            f"*Updated: {report.generated_at.strftime('%Y-%m-%d %H:%M')}*",
            ""
        ]

        # Weekly Summary
        lines.extend(self._format_weekly_summary(report))
        lines.append("")

        # Alerts (critical and warning only)
        if report.critical_alerts or report.warning_alerts:
            lines.append("### Alerts")
            lines.append("")

            for alert in report.critical_alerts[:3]:
                emoji = "🔴" if alert.severity.name == "CRITICAL" else "⚠️"
                lines.append(f"{emoji} **{alert.title}**")
                lines.append(f"_{alert.description}_")
                lines.append("")

            for alert in report.warning_alerts[:2]:
                lines.append(f"⚠️ **{alert.title}**")
                lines.append(f"_{alert.description}_")
                lines.append("")

        # Strategic Alignment
        if report.goal_correlations:
            lines.extend(self._format_strategic_alignment(report))
            lines.append("")

        # Trim if needed
        if len(lines) > self.MAX_EXECUTIVE_SECTION_LINES:
            lines = lines[:self.MAX_EXECUTIVE_SECTION_LINES - 2]
            lines.extend(["", "_(Additional insights omitted)_"])

        return "\n".join(lines)

    def _format_weekly_summary(self, report: ExecutiveInsightReport) -> List[str]:
        """Format weekly summary section.

        Args:
            report: ExecutiveInsightReport

        Returns:
            List of formatted lines
        """
        lines = ["### Weekly Summary", ""]

        snapshot = report.weekly_snapshot

        # Productivity trend
        productivity_trend = self._find_trend(report.trend_metrics, "productivity_score")
        if productivity_trend:
            arrow = self._trend_arrow(productivity_trend.change_percent)
            lines.append(f"- Productivity: {arrow} {productivity_trend.change_percent:+.0f}%")

        # Alignment trend
        alignment_trend = self._find_trend(report.trend_metrics, "strategic_alignment")
        if alignment_trend:
            arrow = self._trend_arrow(alignment_trend.change_percent)
            lines.append(f"- Strategic Alignment: {arrow} {alignment_trend.change_percent:+.0f}%")

        # Alert count
        if report.critical_alerts or report.warning_alerts:
            alert_count = len(report.critical_alerts) + len(report.warning_alerts)
            lines.append(f"- Key Alerts: {alert_count} requiring attention")

        # At-risk goals
        if report.at_risk_goals:
            lines.append(f"- At-Risk OKRs: {len(report.at_risk_goals)} need attention")

        return lines

    def _format_strategic_alignment(self, report: ExecutiveInsightReport) -> List[str]:
        """Format strategic alignment section.

        Args:
            report: ExecutiveInsightReport

        Returns:
            List of formatted lines
        """
        lines = ["### Strategic Alignment", ""]

        # Top 3 goal correlations
        for i, correlation in enumerate(report.goal_correlations[:3], 1):
            # Progress emoji
            if correlation.progress_indicator.value == "on_track":
                emoji = "✅"
            elif correlation.progress_indicator.value == "at_risk":
                emoji = "⚠️"
            else:
                emoji = "🔴"

            lines.append(f"{i}. {emoji} **{correlation.okr_title}**")
            lines.append(f"   Alignment: {correlation.alignment_score:.0%} | {correlation.progress_indicator.value.title()}")

            if correlation.recommendations:
                lines.append(f"   → {correlation.recommendations[0]}")

            lines.append("")

        return lines

    def _generate_executive_summary(
        self,
        snapshot: WeeklySnapshot,
        trends: List[TrendMetric],
        alerts: List[ExecutiveAlert],
        goals: List[GoalCorrelation]
    ) -> str:
        """Generate 3-5 bullet executive briefing.

        Args:
            snapshot: Current weekly snapshot
            trends: Trend metrics
            alerts: Executive alerts
            goals: Goal correlations

        Returns:
            Executive summary string
        """
        bullets = []

        # Productivity summary
        productivity_trend = self._find_trend(trends, "productivity_score")
        if productivity_trend:
            if productivity_trend.change_percent > 0:
                bullets.append(
                    f"Productivity improved by {productivity_trend.change_percent:.0f}% "
                    f"to {productivity_trend.current_value:.2f}"
                )
            elif productivity_trend.change_percent < -10:
                bullets.append(
                    f"Productivity declined by {abs(productivity_trend.change_percent):.0f}% "
                    f"to {productivity_trend.current_value:.2f} - requires attention"
                )

        # Strategic alignment summary
        alignment_trend = self._find_trend(trends, "strategic_alignment")
        if alignment_trend:
            aligned_goals = len([g for g in goals if g.alignment_score >= 0.5])
            bullets.append(
                f"{aligned_goals} of 4 DPD objectives showing strong alignment "
                f"({alignment_trend.current_value:.0%} avg alignment score)"
            )

        # Alert summary
        critical_count = len([a for a in alerts if a.severity.name == "CRITICAL"])
        if critical_count > 0:
            bullets.append(f"{critical_count} critical issues requiring immediate attention")

        # Pattern diversity
        if snapshot.pattern_diversity > 0.7:
            bullets.append(f"High pattern diversity ({snapshot.pattern_diversity:.0%}) - balanced work approach")
        elif snapshot.pattern_diversity < 0.3:
            bullets.append(f"Low pattern diversity ({snapshot.pattern_diversity:.0%}) - may indicate narrow focus")

        return "\n".join(f"• {b}" for b in bullets[:5]) if bullets else "• Insufficient data for summary"

    def _find_trend(self, trends: List[TrendMetric], metric_name: str) -> Optional[TrendMetric]:
        """Find a specific trend metric by name.

        Args:
            trends: List of trend metrics
            metric_name: Name to find

        Returns:
            TrendMetric or None
        """
        for trend in trends:
            if trend.metric_name == metric_name:
                return trend
        return None

    def _trend_arrow(self, change_percent: float) -> str:
        """Get trend arrow emoji from change percentage.

        Args:
            change_percent: Percentage change

        Returns:
            Arrow emoji string
        """
        if change_percent > 5:
            return "📈"
        elif change_percent < -5:
            return "📉"
        else:
            return "→"

    def _empty_report(self) -> ExecutiveInsightReport:
        """Create an empty report for disabled state.

        Returns:
            Empty ExecutiveInsightReport
        """
        return ExecutiveInsightReport(
            generated_at=datetime.now(),
            weekly_snapshot=WeeklySnapshot(
                period_start=date.today(),
                period_end=date.today(),
                total_events=0,
                productivity_score=0.0,
                strategic_alignment_avg=0.0,
                top_patterns=[],
                anomalies_detected=0
            ),
            trend_metrics=[],
            alerts=[],
            goal_correlations=[],
            summary="Executive intelligence disabled"
        )

    async def get_performance_metrics(self) -> Dict[str, Any]:
        """Get performance metrics for the synthesizer.

        Returns:
            Dictionary with performance metrics
        """
        from .pattern_store import PatternStore

        store = PatternStore(self.workspace_root)
        await store.initialize()

        # Get counts from database
        stats = await store.get_stats()

        return {
            "enabled": self.enabled,
            "database_stats": stats,
            "config": {
                "max_synthesis_time": self.MAX_SYNTHESIS_TIME_SECONDS,
                "max_section_lines": self.MAX_EXECUTIVE_SECTION_LINES
            }
        }
