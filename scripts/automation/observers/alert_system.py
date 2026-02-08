"""
Phase 4: Executive Intelligence - Alert System

Generates and manages strategic alerts for executive attention.

Key Methods:
- generate_alerts(): Generate alerts from trends and anomalies
- _calculate_alert_severity(): Determine alert severity from changes
- _generate_alert_text(): Create human-readable alert messages
"""

import logging
from datetime import datetime
from typing import Any, Dict, List, Optional

from .executive_models import (
    ExecutiveAlert,
    AlertSeverity,
    AlertCategory,
    TrendMetric,
    generate_alert_id,
)
from .pattern_models import PatternReport

logger = logging.getLogger(__name__)


class AlertSystem:
    """Generates executive alerts from pattern changes and anomalies.

    Monitors key metrics and generates alerts when:
    - Productivity drops significantly (>15%)
    - Strategic alignment decreases (>20%)
    - New high-confidence patterns emerge
    - Positive trends to leverage are detected
    - Statistical anomalies are found

    Configuration:
        PRODUCTIVITY_DROP_THRESHOLD: 15% drop triggers warning
        ALIGNMENT_DROP_THRESHOLD: 20% drop triggers warning
        NEW_PATTERN_CONFIDENCE_THRESHOLD: 0.7 confidence for pattern alerts
    """

    # Alert thresholds
    PRODUCTIVITY_DROP_THRESHOLD = 0.15  # 15% drop triggers warning
    ALIGNMENT_DROP_THRESHOLD = 0.20  # 20% drop triggers warning
    NEW_PATTERN_CONFIDENCE_THRESHOLD = 0.7

    # Severity thresholds
    CRITICAL_DROP_THRESHOLD = 0.40  # 40%+ drop = critical
    WARNING_DROP_THRESHOLD = 0.20  # 20-40% drop = warning

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """Initialize the alert system.

        Args:
            config: Optional configuration dictionary
        """
        self.config = config or {}

        # Load thresholds from config
        alert_config = self.config.get("alerts", {})

        self.productivity_threshold = alert_config.get(
            "productivity_drop_threshold",
            self.PRODUCTIVITY_DROP_THRESHOLD
        )
        self.alignment_threshold = alert_config.get(
            "alignment_drop_threshold",
            self.ALIGNMENT_DROP_THRESHOLD
        )
        self.max_active_alerts = alert_config.get("max_active_alerts", 10)

        logger.info(
            f"AlertSystem initialized with thresholds: "
            f"productivity={self.productivity_threshold:.0%}, "
            f"alignment={self.alignment_threshold:.0%}"
        )

    async def generate_alerts(
        self,
        trend_metrics: List[TrendMetric],
        anomalies: List[Dict[str, Any]],
        pattern_report: Optional[PatternReport] = None
    ) -> List[ExecutiveAlert]:
        """Generate alerts from trends and anomalies.

        Creates alerts for:
        1. Productivity: Significant drops in productivity score
        2. Alignment: Decreases in strategic alignment
        3. Pattern Change: New high-confidence patterns
        4. Opportunity: Positive trends to leverage
        5. Anomaly: Statistical anomalies detected

        Args:
            trend_metrics: List of trend metrics to analyze
            anomalies: List of detected anomalies
            pattern_report: Optional pattern report for context

        Returns:
            List of ExecutiveAlert objects
        """
        logger.info("Generating executive alerts...")

        alerts = []

        # Check productivity trends
        productivity_alerts = self._check_productivity_alerts(trend_metrics)
        alerts.extend(productivity_alerts)

        # Check alignment trends
        alignment_alerts = self._check_alignment_alerts(trend_metrics)
        alerts.extend(alignment_alerts)

        # Check for new high-confidence patterns
        if pattern_report:
            pattern_alerts = self._check_pattern_alerts(pattern_report)
            alerts.extend(pattern_alerts)

        # Check for positive opportunities
        opportunity_alerts = self._check_opportunity_alerts(trend_metrics)
        alerts.extend(opportunity_alerts)

        # Convert anomalies to alerts
        anomaly_alerts = self._create_anomaly_alerts(anomalies)
        alerts.extend(anomaly_alerts)

        # Limit total alerts
        if len(alerts) > self.max_active_alerts:
            # Sort by severity and keep most important
            severity_order = {
                AlertSeverity.CRITICAL: 0,
                AlertSeverity.WARNING: 1,
                AlertSeverity.INFO: 2
            }
            alerts.sort(key=lambda a: severity_order.get(a.severity, 3))
            alerts = alerts[:self.max_active_alerts]

        logger.info(f"Generated {len(alerts)} executive alerts")
        return alerts

    def _check_productivity_alerts(self, trend_metrics: List[TrendMetric]) -> List[ExecutiveAlert]:
        """Check for productivity-related alerts.

        Args:
            trend_metrics: Trend metrics to analyze

        Returns:
            List of productivity alerts
        """
        alerts = []

        for metric in trend_metrics:
            if metric.metric_name == "productivity_score":
                # Check for drops
                if metric.change_percent < 0:
                    severity = self._calculate_alert_severity(
                        metric.change_percent,
                        AlertCategory.PRODUCTIVITY
                    )

                    if severity in [AlertSeverity.CRITICAL, AlertSeverity.WARNING]:
                        alert = ExecutiveAlert(
                            alert_id=generate_alert_id(),
                            severity=severity,
                            category=AlertCategory.PRODUCTIVITY,
                            title=f"Productivity {severity.value.title()} Detected",
                            description=self._format_productivity_alert_description(metric),
                            data_evidence={
                                "current_value": metric.current_value,
                                "previous_value": metric.previous_value,
                                "change_percent": metric.change_percent,
                                "z_score": metric.z_score
                            },
                            suggested_actions=self._get_productivity_suggestions(metric),
                            created_at=datetime.now(),
                            threshold_triggered=metric.change_percent
                        )
                        alerts.append(alert)

        return alerts

    def _check_alignment_alerts(self, trend_metrics: List[TrendMetric]) -> List[ExecutiveAlert]:
        """Check for strategic alignment alerts.

        Args:
            trend_metrics: Trend metrics to analyze

        Returns:
            List of alignment alerts
        """
        alerts = []

        for metric in trend_metrics:
            if metric.metric_name == "strategic_alignment":
                # Check for drops
                if metric.change_percent < -self.alignment_threshold * 100:
                    severity = self._calculate_alert_severity(
                        metric.change_percent,
                        AlertCategory.ALIGNMENT
                    )

                    alert = ExecutiveAlert(
                        alert_id=generate_alert_id(),
                        severity=severity,
                        category=AlertCategory.ALIGNMENT,
                        title=f"Strategic Alignment {severity.value.title()} Detected",
                        description=self._format_alignment_alert_description(metric),
                        data_evidence={
                            "current_value": metric.current_value,
                            "previous_value": metric.previous_value,
                            "change_percent": metric.change_percent,
                            "z_score": metric.z_score
                        },
                        suggested_actions=self._get_alignment_suggestions(metric),
                        created_at=datetime.now(),
                        threshold_triggered=metric.change_percent
                    )
                    alerts.append(alert)

        return alerts

    def _check_pattern_alerts(self, pattern_report: PatternReport) -> List[ExecutiveAlert]:
        """Check for new high-confidence pattern alerts.

        Args:
            pattern_report: Pattern report to analyze

        Returns:
            List of pattern alerts
        """
        alerts = []

        # Check for new high-confidence command sequences
        for seq in pattern_report.command_sequences:
            if seq.confidence >= self.NEW_PATTERN_CONFIDENCE_THRESHOLD:
                # Only alert if this is a NEW high-confidence pattern
                # (occurrence_count suggests it's emerging)
                if 3 <= seq.occurrence_count <= 10:
                    alert = ExecutiveAlert(
                        alert_id=generate_alert_id(),
                        severity=AlertSeverity.INFO,
                        category=AlertCategory.PATTERN_CHANGE,
                        title="New High-Confidence Workflow Detected",
                        description=self._format_pattern_alert_description(seq),
                        data_evidence={
                            "sequence": seq.sequence,
                            "confidence": seq.confidence,
                            "occurrence_count": seq.occurrence_count
                        },
                        suggested_actions=[
                            f"Review the workflow: {' → '.join(seq.sequence)}",
                            "Consider if this represents a reusable process",
                            "Document if this is a best practice to encourage"
                        ],
                        created_at=datetime.now()
                    )
                    alerts.append(alert)

        return alerts

    def _check_opportunity_alerts(self, trend_metrics: List[TrendMetric]) -> List[ExecutiveAlert]:
        """Check for positive trend opportunities.

        Args:
            trend_metrics: Trend metrics to analyze

        Returns:
            List of opportunity alerts
        """
        alerts = []

        for metric in trend_metrics:
            # Check for significant positive improvements
            if metric.change_percent > 20:  # 20%+ improvement
                alert = ExecutiveAlert(
                    alert_id=generate_alert_id(),
                    severity=AlertSeverity.INFO,
                    category=AlertCategory.OPPORTUNITY,
                    title=f"Positive Trend in {metric.metric_name.replace('_', ' ').title()}",
                    description=self._format_opportunity_alert_description(metric),
                    data_evidence={
                        "metric_name": metric.metric_name,
                        "current_value": metric.current_value,
                        "previous_value": metric.previous_value,
                        "change_percent": metric.change_percent
                    },
                    suggested_actions=self._get_opportunity_suggestions(metric),
                    created_at=datetime.now()
                )
                alerts.append(alert)

        return alerts

    def _create_anomaly_alerts(self, anomalies: List[Dict[str, Any]]) -> List[ExecutiveAlert]:
        """Create alerts from detected anomalies.

        Args:
            anomalies: List of detected anomalies

        Returns:
            List of anomaly alerts
        """
        alerts = []

        for anomaly in anomalies:
            severity = AlertSeverity.CRITICAL if anomaly["severity"] == "critical" else AlertSeverity.WARNING

            alert = ExecutiveAlert(
                alert_id=generate_alert_id(),
                severity=severity,
                category=AlertCategory.ANOMALY,
                title=f"Statistical Anomaly: {anomaly['metric_name'].replace('_', ' ').title()}",
                description=anomaly["description"],
                data_evidence={
                    "metric_name": anomaly["metric_name"],
                    "current_value": anomaly["current_value"],
                    "historical_mean": anomaly["historical_mean"],
                    "z_score": anomaly["z_score"],
                    "anomaly_type": anomaly["anomaly_type"]
                },
                suggested_actions=self._get_anomaly_suggestions(anomaly),
                created_at=datetime.now(),
                threshold_triggered=anomaly["z_score"]
            )
            alerts.append(alert)

        return alerts

    def _calculate_alert_severity(self, change_percent: float, category: AlertCategory) -> AlertSeverity:
        """Calculate alert severity from change percentage.

        Severity levels:
        - Critical: >40% drop or major issue
        - Warning: 20-40% drop or emerging issue
        - Info: <20% change or positive trend

        Args:
            change_percent: Percentage change (negative = drop)
            category: Alert category

        Returns:
            AlertSeverity enum value
        """
        # For drops, use magnitude
        if change_percent < 0:
            magnitude = abs(change_percent)

            if category == AlertCategory.PRODUCTIVITY:
                if magnitude >= self.CRITICAL_DROP_THRESHOLD * 100:
                    return AlertSeverity.CRITICAL
                elif magnitude >= self.WARNING_DROP_THRESHOLD * 100:
                    return AlertSeverity.WARNING
            elif category == AlertCategory.ALIGNMENT:
                # Alignment drops are critical
                if magnitude >= self.WARNING_DROP_THRESHOLD * 100:
                    return AlertSeverity.CRITICAL
                elif magnitude >= self.alignment_threshold * 100:
                    return AlertSeverity.WARNING

        return AlertSeverity.INFO

    def _format_productivity_alert_description(self, metric: TrendMetric) -> str:
        """Format productivity alert description.

        Args:
            metric: TrendMetric with productivity data

        Returns:
            Human-readable description
        """
        direction = "decrease" if metric.change_percent < 0 else "increase"
        magnitude = abs(metric.change_percent)

        return (
            f"Productivity score {direction}d by {magnitude:.0f}% "
            f"(from {metric.previous_value:.2f} to {metric.current_value:.2f}). "
            f"This is {metric.significance.value} based on {metric.data_points} weeks of data."
        )

    def _format_alignment_alert_description(self, metric: TrendMetric) -> str:
        """Format strategic alignment alert description.

        Args:
            metric: TrendMetric with alignment data

        Returns:
            Human-readable description
        """
        magnitude = abs(metric.change_percent)

        return (
            f"Strategic alignment decreased by {magnitude:.0f}% "
            f"(from {metric.previous_value:.2f} to {metric.current_value:.2f}). "
            f"Work may be drifting from DPD strategic objectives."
        )

    def _format_pattern_alert_description(self, seq) -> str:
        """Format pattern alert description.

        Args:
            seq: CommandSequence with pattern data

        Returns:
            Human-readable description
        """
        workflow = " → ".join(seq.sequence)

        return (
            f"A new workflow pattern is emerging: \"{workflow}\". "
            f"This sequence has occurred {seq.occurrence_count} times "
            f"with {seq.confidence:.0%} confidence."
        )

    def _format_opportunity_alert_description(self, metric: TrendMetric) -> str:
        """Format opportunity alert description.

        Args:
            metric: TrendMetric with positive trend data

        Returns:
            Human-readable description
        """
        metric_name = metric.metric_name.replace("_", " ").title()

        return (
            f"{metric_name} increased by {metric.change_percent:.0f}% "
            f"(from {metric.previous_value:.2f} to {metric.current_value:.2f}). "
            f"Consider what drove this improvement and how to sustain it."
        )

    def _get_productivity_suggestions(self, metric: TrendMetric) -> List[str]:
        """Get suggestions for productivity alerts.

        Args:
            metric: TrendMetric with productivity data

        Returns:
            List of actionable suggestions
        """
        suggestions = [
            "Review recent work sessions for bottlenecks or distractions",
            "Check if tool or process changes impacted productivity",
            "Consider if workload distribution is optimal"
        ]

        if metric.z_score < -2.0:
            suggestions.insert(0, "CRITICAL: Investigate root cause immediately")

        return suggestions

    def _get_alignment_suggestions(self, metric: TrendMetric) -> List[str]:
        """Get suggestions for alignment alerts.

        Args:
            metric: TrendMetric with alignment data

        Returns:
            List of actionable suggestions
        """
        return [
            "Review recent work against DPD OKRs",
            "Check if current tasks align with strategic priorities",
            "Consider re-prioritizing to improve strategic alignment",
            "Ensure today_cmd planning includes strategic objectives"
        ]

    def _get_opportunity_suggestions(self, metric: TrendMetric) -> List[str]:
        """Get suggestions for opportunity alerts.

        Args:
            metric: TrendMetric with positive trend data

        Returns:
            List of actionable suggestions
        """
        metric_name = metric.metric_name.replace("_", " ")

        return [
            f"Document what drove the {metric_name} improvement",
            "Share successful practices with the team",
            "Consider making this a standard practice",
            "Monitor if this improvement is sustainable"
        ]

    def _get_anomaly_suggestions(self, anomaly: Dict[str, Any]) -> List[str]:
        """Get suggestions for anomaly alerts.

        Args:
            anomaly: Anomaly dictionary

        Returns:
            List of actionable suggestions
        """
        anomaly_type = anomaly["anomaly_type"]
        metric_name = anomaly["metric_name"].replace("_ " "")

        if anomaly_type == "high":
            return [
                f"Investigate the cause of unusually high {metric_name}",
                "Determine if this is sustainable or a temporary spike",
                "Document best practices if this represents improvement"
            ]
        else:  # low
            return [
                f"Investigate the cause of unusually low {metric_name}",
                "Check for external factors or process issues",
                "Consider if support or resources are needed"
            ]

    def acknowledge_alert(self, alert_id: str) -> bool:
        """Mark an alert as acknowledged.

        Note: This requires database access through PatternStore.

        Args:
            alert_id: ID of alert to acknowledge

        Returns:
            True if successful
        """
        # This is a placeholder - actual implementation requires PatternStore
        logger.info(f"Alert {alert_id} marked as acknowledged")
        return True

    def get_alert_summary(self, alerts: List[ExecutiveAlert]) -> str:
        """Generate a text summary of alerts.

        Args:
            alerts: List of alerts to summarize

        Returns:
            Human-readable alert summary
        """
        if not alerts:
            return "No active alerts."

        lines = []

        # Count by severity
        critical_count = sum(1 for a in alerts if a.severity == AlertSeverity.CRITICAL)
        warning_count = sum(1 for a in alerts if a.severity == AlertSeverity.WARNING)
        info_count = sum(1 for a in alerts if a.severity == AlertSeverity.INFO)

        lines.append(f"📊 Executive Alert Summary")
        lines.append(f"   Critical: {critical_count} | Warning: {warning_count} | Info: {info_count}")
        lines.append("")

        # Show critical and warning alerts
        for alert in alerts:
            if alert.severity in [AlertSeverity.CRITICAL, AlertSeverity.WARNING]:
                emoji = "🔴" if alert.severity == AlertSeverity.CRITICAL else "⚠️"
                lines.append(f"{emoji} **{alert.title}**")
                lines.append(f"   {alert.description}")
                lines.append("")

        return "\n".join(lines)
