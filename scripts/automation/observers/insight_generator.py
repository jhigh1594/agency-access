"""
InsightGenerator - Pattern formatting and statistical insights.

Design:
- Formats statistical patterns for Claude Code interpretation
- Generates basic statistical summaries
- No external API calls - uses Claude Code's built-in capabilities
- Graceful degradation: works purely statistical if needed
"""

import logging
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

from .pattern_models import (
    CommandSequence,
    FileCluster,
    InsightReport,
    PatternReport,
    SuccessCorrelation,
    TimePatternSummary,
)

# Phase 4: Executive Intelligence imports
from .executive_models import ExecutiveInsightReport
from .executive_synthesizer import ExecutiveSynthesizer

logger = logging.getLogger(__name__)


class InsightGenerator:
    """Generates insights from pattern reports.

    Responsibilities:
    - Format patterns for display (Markdown)
    - Prepare patterns for Claude Code interpretation
    - Generate statistical summaries
    - Trigger deeper analysis when patterns are significant
    """

    def __init__(self, workspace_root: Path):
        """Initialize with workspace path.

        Args:
            workspace_root: Path to workspace root directory
        """
        self.workspace_root = workspace_root

    async def generate_insights(self, pattern_report: PatternReport) -> InsightReport:
        """Generate formatted insights from pattern report.

        Returns structured patterns that Claude Code can interpret,
        plus basic statistical summaries.

        Args:
            pattern_report: PatternReport from PatternAnalyzer

        Returns:
            InsightReport with formatted patterns and summaries
        """
        logger.info("Generating insights from pattern report...")

        # Extract statistical patterns
        statistical_patterns = self._extract_statistical_patterns(pattern_report)

        # Generate formatted summary for display
        formatted_summary = self._format_summary_display(pattern_report)

        # Create Claude Code prompt for deeper interpretation
        claude_code_prompt = self._format_for_claude_code(pattern_report)

        insights = InsightReport(
            statistical_patterns=statistical_patterns,
            formatted_summary=formatted_summary,
            claude_code_prompt=claude_code_prompt,
            generated_at=datetime.now().isoformat()
        )

        logger.info(f"Generated {insights.insight_count} insight categories")
        return insights

    def _extract_statistical_patterns(self, report: PatternReport) -> Dict[str, Any]:
        """Extract raw pattern data for statistical analysis.

        Args:
            report: PatternReport to extract from

        Returns:
            Dictionary of pattern data by category
        """
        patterns: Dict[str, Any] = {}

        # Command sequences
        if report.command_sequences:
            patterns["command_sequences"] = [
                {
                    "sequence": seq.sequence,
                    "count": seq.occurrence_count,
                    "confidence": seq.confidence,
                    "display": str(seq)
                }
                for seq in report.command_sequences[:10]  # Top 10
            ]

        # File clusters
        if report.file_clusters:
            patterns["file_clusters"] = [
                {
                    "cluster_id": cluster.cluster_id,
                    "files": cluster.files,
                    "similarity": cluster.jaccard_similarity,
                    "count": cluster.co_occurrence_count,
                    "display": str(cluster)
                }
                for cluster in report.file_clusters[:10]
            ]

        # Time patterns
        if report.time_patterns:
            tp = report.time_patterns
            patterns["time_patterns"] = {
                "peak_hours": tp.peak_hours,
                "peak_hours_display": tp.peak_hours_display,
                "peak_days": tp.peak_days,
                "avg_session_minutes": tp.avg_session_duration_minutes,
                "most_productive_hour": tp.most_productive_hour,
                "sessions_by_hour": tp.session_count_by_hour
            }

        # Success correlations
        if report.success_correlations:
            patterns["success_correlations"] = [
                {
                    "activity": corr.activity_pattern,
                    "outcome": corr.outcome_type,
                    "strength": corr.correlation_strength,
                    "sample_size": corr.sample_size,
                    "display": str(corr)
                }
                for corr in report.success_correlations[:10]
            ]

        patterns["analysis_metadata"] = {
            "timestamp": report.analysis_timestamp,
            "overall_confidence": report.confidence,
            "total_patterns": report.pattern_count
        }

        return patterns

    def _format_summary_display(self, report: PatternReport) -> str:
        """Format insights as Markdown for display in memory.md.

        Args:
            report: PatternReport to format

        Returns:
            Markdown-formatted summary
        """
        lines = [
            "## Pattern Insights",
            f"",
            f"*Updated: {datetime.now().strftime('%Y-%m-%d %H:%M')}*",
            f""
        ]

        # Productivity Patterns
        if report.time_patterns:
            tp = report.time_patterns
            lines.extend([
                "### Productivity Patterns",
                f""
            ])

            if tp.peak_hours:
                lines.append(f"- **Peak hours**: {tp.peak_hours_display}")
            if tp.avg_session_duration_minutes > 0:
                from .pattern_models import format_duration
                lines.append(f"- **Average session**: {format_duration(tp.avg_session_duration_minutes)}")
            if tp.most_productive_hour is not None:
                lines.append(f"- **Most productive hour**: {tp.most_productive_hour}:00")
            lines.append("")

        # Workflow Patterns
        workflow_patterns = []
        if report.command_sequences:
            workflow_patterns.extend([
                "### Workflow Patterns",
                f""
            ])
            for seq in report.command_sequences[:5]:
                workflow_patterns.append(f"- **{seq}** ({seq.occurrence_count}x)")
            workflow_patterns.append("")

        if report.file_clusters:
            if not workflow_patterns:
                workflow_patterns.extend(["### Workflow Patterns", ""])
            for cluster in report.file_clusters[:3]:
                # Show just file count for brevity
                workflow_patterns.append(
                    f"- **{cluster.cluster_id}**: "
                    f"{len(cluster.files)} files edited together"
                )
            workflow_patterns.append("")

        lines.extend(workflow_patterns)

        # Success Correlations
        if report.success_correlations:
            lines.extend([
                "### Success Signals",
                f""
            ])
            for corr in report.success_correlations[:5]:
                lines.append(f"- {corr}")
            lines.append("")

        # Summary
        lines.extend([
            "---",
            f"",
            f"*Pattern confidence: {report.confidence:.1%}*",
            f"*Total patterns detected: {report.pattern_count}*",
            f""
        ])

        return "\n".join(lines)

    def _format_for_claude_code(self, report: PatternReport) -> str:
        """Format patterns as structured text for Claude Code analysis.

        Creates a prompt that Claude Code can use to generate
        deeper insights and recommendations.

        Args:
            report: PatternReport to format

        Returns:
            Structured prompt for Claude Code interpretation
        """
        lines = [
            "# Pattern Analysis Request",
            "",
            "Please analyze the following pattern data and provide:",
            "1. Key observations about productivity patterns",
            "2. Potential workflow optimizations",
            "3. Recommendations based on detected patterns",
            "",
            "## Pattern Data",
            ""
        ]

        # Command sequences
        if report.command_sequences:
            lines.extend([
                "### Command Sequences",
                "Common workflow patterns detected:",
                ""
            ])
            for seq in report.command_sequences[:5]:
                lines.append(
                    f"- `{seq.sequence}`: "
                    f"occurred {seq.occurrence_count} times "
                    f"(confidence: {seq.confidence:.1%})"
                )
            lines.append("")

        # File clusters
        if report.file_clusters:
            lines.extend([
                "### File Clusters",
                "Files frequently edited together:",
                ""
            ])
            for cluster in report.file_clusters[:5]:
                lines.append(
                    f"- **{cluster.cluster_id}** ({cluster.jaccard_similarity:.1%} similarity):"
                )
                for file_path in cluster.files[:3]:
                    lines.append(f"  - `{file_path}`")
                if len(cluster.files) > 3:
                    lines.append(f"  - ... and {len(cluster.files) - 3} more")
            lines.append("")

        # Time patterns
        if report.time_patterns:
            tp = report.time_patterns
            lines.extend([
                "### Time Patterns",
                ""
            ])
            if tp.peak_hours:
                lines.append(f"- Peak activity hours: {tp.peak_hours}")
            if tp.peak_days:
                day_names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
                peak_day_names = [day_names[d] for d in tp.peak_days]
                lines.append(f"- Peak days: {', '.join(peak_day_names)}")
            if tp.avg_session_duration_minutes > 0:
                from .pattern_models import format_duration
                lines.append(f"- Average session length: {format_duration(tp.avg_session_duration_minutes)}")
            lines.append("")

        # Success correlations
        if report.success_correlations:
            lines.extend([
                "### Success Correlations",
                "Activities that correlate with positive outcomes:",
                ""
            ])
            for corr in report.success_correlations[:5]:
                lines.append(
                    f"- `{corr.activity_pattern}` → `{corr.outcome_type}` "
                    f"(correlation: {corr.correlation_strength:.2f}, "
                    f"n={corr.sample_size})"
                )
            lines.append("")

        lines.extend([
            "## Analysis Context",
            "",
            f"- Analysis timestamp: {report.analysis_timestamp}",
            f"- Overall pattern confidence: {report.confidence:.1%}",
            f"- Total patterns detected: {report.pattern_count}",
            "",
            "## Output Format",
            "",
            "Please provide your analysis in the following format:",
            "1. **Observations**: 3-5 bullet points of key findings",
            "2. **Recommendations**: 3-5 actionable suggestions",
            "3. **Questions**: 2-3 questions for further exploration",
            ""
        ])

        return "\n".join(lines)

    def format_productivity_insights(self, time_patterns: TimePatternSummary) -> str:
        """Format time-based productivity insights.

        Args:
            time_patterns: TimePatternSummary to format

        Returns:
            Formatted insights string
        """
        insights = []

        if time_patterns.peak_hours:
            hours_display = time_patterns.peak_hours_display
            insights.append(f"Peak productivity: {hours_display}")

        if time_patterns.avg_session_duration_minutes > 0:
            from .pattern_models import format_duration
            duration = format_duration(time_patterns.avg_session_duration_minutes)
            insights.append(f"Average session: {duration}")

        return " | ".join(insights) if insights else "No productivity data yet"

    def format_workflow_insights(
        self,
        sequences: List[CommandSequence],
        clusters: List[FileCluster]
    ) -> str:
        """Format workflow pattern insights.

        Args:
            sequences: Command sequences detected
            clusters: File clusters detected

        Returns:
            Formatted insights string
        """
        insights = []

        if sequences:
            top_seq = sequences[0]
            insights.append(f"Common workflow: {top_seq}")

        if clusters:
            top_cluster = clusters[0]
            insights.append(f"Active work: {len(top_cluster.files)} related files")

        return " | ".join(insights) if insights else "No workflow patterns yet"


    # =========================================================================
    # Phase 4: Executive Intelligence - Synthesis Methods
    # =========================================================================

    async def generate_executive_insights(
        self,
        pattern_report: PatternReport,
        enable_executive: bool = True,
        prediction_report: Optional[Any] = None,
        recent_analysis: Optional[Any] = None
    ) -> Optional[ExecutiveInsightReport]:
        """Generate executive-level strategic intelligence report.

        This is the main entry point for Phase 4 executive intelligence.
        Delegates to ExecutiveSynthesizer for comprehensive analysis.

        Args:
            pattern_report: PatternReport with current patterns
            enable_executive: Whether to generate executive insights
            prediction_report: Optional PredictionReport for context
            recent_analysis: Optional AnalyzedData from today_cmd

        Returns:
            ExecutiveInsightReport or None if disabled
        """
        if not enable_executive:
            logger.debug("Executive intelligence synthesis disabled")
            return None

        try:
            from .executive_synthesizer import ExecutiveSynthesizer

            synthesizer = ExecutiveSynthesizer(
                self.workspace_root,
                config=self._get_config()
            )

            report = await synthesizer.generate_executive_report(
                pattern_report=pattern_report,
                prediction_report=prediction_report,
                recent_analysis=recent_analysis
            )

            logger.info(
                f"Executive synthesis complete: "
                f"{len(report.trend_metrics)} trends, "
                f"{len(report.alerts)} alerts, "
                f"{len(report.goal_correlations)} goal correlations"
            )

            return report

        except Exception as e:
            logger.error(f"Executive synthesis failed: {e}")
            return None

    def _get_config(self) -> Dict[str, Any]:
        """Get configuration from AIPMOS config file.

        Returns:
            Configuration dictionary
        """
        try:
            import yaml

            config_path = self.workspace_root / ".aipmos" / "aipmos.yaml"
            if config_path.exists():
                with open(config_path) as f:
                    return yaml.safe_load(f)
        except Exception as e:
            logger.debug(f"Could not load config: {e}")

        return {}


def calculate_pattern_importance(
    occurrence_count: int,
    confidence: float,
    recency_score: float = 1.0
) -> float:
    """Calculate overall importance score for a pattern.

    Args:
        occurrence_count: How often pattern occurs
        confidence: Pattern confidence (0.0 to 1.0)
        recency_score: Recency bonus (0.0 to 1.0)

    Returns:
        Importance score (0.0 to 1.0)
    """
    # Weighted combination
    frequency_score = min(1.0, occurrence_count / 10.0)
    return (frequency_score * 0.4 + confidence * 0.4 + recency_score * 0.2)
