"""
Phase 3: Predictive Suggestions - Prediction Formatter

This module formats predictions for various output channels:
- memory.md display
- Console output
- Claude Code interpretation
- JSON export

Design: Bloat-aware formatting with configurable detail levels.
"""

from typing import List, Dict, Any, Optional
from datetime import datetime

from .prediction_models import (
    ActionSuggestion,
    WorkflowPrediction,
    TimingSuggestion,
    SessionStartRecommendation,
    PredictionReport,
    Urgency
)


class PredictionFormatter:
    """Format predictions for various output channels."""

    def __init__(self, max_lines: int = 40, max_suggestions: int = 5):
        """Initialize the formatter.

        Args:
            max_lines: Maximum lines for memory.md section (bloat prevention)
            max_suggestions: Maximum suggestions to display
        """
        self.max_lines = max_lines
        self.max_suggestions = max_suggestions

    def format_for_memory_md(
        self,
        report: PredictionReport,
        detail_level: str = "medium"
    ) -> str:
        """Format predictions for memory.md display.

        Args:
            report: Prediction report to format
            detail_level: 'minimal', 'medium', or 'verbose'

        Returns:
            Formatted markdown string
        """
        lines = ["## Suggested Actions", ""]
        current_lines = 2

        # Add timestamp
        lines.append(f"_Generated {report.generated_at.strftime('%H:%M')} on {report.generated_at.strftime('%Y-%m-%d')}_")
        lines.append("")
        current_lines += 2

        # Add suggestions
        if report.suggestions:
            for suggestion in report.suggestions[:self.max_suggestions]:
                section = self._format_suggestion_md(suggestion, detail_level)
                section_lines = section.count("\n") + 1

                if current_lines + section_lines > self.max_lines:
                    # Truncate to prevent bloat
                    lines.append("_(Additional suggestions omitted to prevent bloat)_")
                    lines.append("")
                    break

                lines.extend(section.split("\n"))
                current_lines += section_lines

        # Add workflow prediction if available
        if report.workflow_prediction and current_lines < self.max_lines - 5:
            lines.append("")
            workflow_section = self._format_workflow_md(report.workflow_prediction, detail_level)
            workflow_lines = workflow_section.count("\n") + 1

            if current_lines + workflow_lines <= self.max_lines:
                lines.extend(workflow_section.split("\n"))
                current_lines += workflow_lines

        # Add timing suggestion if relevant
        if report.timing_suggestion and report.timing_suggestion.current_score < 0.6:
            lines.append("")
            timing_section = self._format_timing_md(report.timing_suggestion, detail_level)
            timing_lines = timing_section.count("\n") + 1

            if current_lines + timing_lines <= self.max_lines:
                lines.extend(timing_section.split("\n"))

        return "\n".join(lines)

    def _format_suggestion_md(
        self,
        suggestion: ActionSuggestion,
        detail_level: str
    ) -> str:
        """Format a single action suggestion as markdown.

        Args:
            suggestion: Action suggestion to format
            detail_level: Detail level for formatting

        Returns:
            Formatted markdown string
        """
        urgency_emoji = {
            Urgency.HIGH: "",
            Urgency.MEDIUM: "",
            Urgency.LOW: ""
        }

        lines = []
        emoji = urgency_emoji.get(suggestion.urgency, "")

        # Main suggestion line
        if suggestion.command:
            lines.append(f"{emoji} **{suggestion.description}** ({suggestion.confidence:.0%})")
        else:
            lines.append(f"{emoji} **{suggestion.description}**")

        # Rationale if available and not minimal
        if suggestion.rationale and detail_level != "minimal":
            lines.append(f"  _{suggestion.rationale}_")

        # Files for file-related suggestions
        if suggestion.files and detail_level != "minimal":
            for file in suggestion.files[:3]:
                # Shorten file paths for readability
                short_path = file.split("/")[-1]
                lines.append(f"  - `{short_path}`")

        return "\n".join(lines)

    def _format_workflow_md(
        self,
        workflow: WorkflowPrediction,
        detail_level: str
    ) -> str:
        """Format a workflow prediction as markdown.

        Args:
            workflow: Workflow prediction to format
            detail_level: Detail level for formatting

        Returns:
            Formatted markdown string
        """
        lines = ["**Incomplete Workflow Detected**", ""]

        if detail_level != "minimal":
            lines.append(f"Workflow: {workflow.workflow_name}")
            lines.append(f"Confidence: {workflow.confidence:.0%}")
            lines.append("")

        if workflow.predicted_steps:
            lines.append("Next steps:")
            for step in workflow.predicted_steps[:3]:
                lines.append(f"  1. {step}")

        return "\n".join(lines)

    def _format_timing_md(
        self,
        timing: TimingSuggestion,
        detail_level: str
    ) -> str:
        """Format a timing suggestion as markdown.

        Args:
            timing: Timing suggestion to format
            detail_level: Detail level for formatting

        Returns:
            Formatted markdown string
        """
        lines = [f"**Timing Note: {timing.activity_type}**", ""]

        if detail_level != "minimal":
            optimal_str = ", ".join(f"{h}:00" for h in timing.optimal_hours[:3])
            lines.append(f"Optimal hours: {optimal_str}")
            lines.append("")

        lines.append(f"_{timing.rationale}_")

        return "\n".join(lines)

    def format_for_console(
        self,
        report: PredictionReport,
        detail_level: str = "medium"
    ) -> str:
        """Format predictions for console output.

        Args:
            report: Prediction report to format
            detail_level: Detail level for formatting

        Returns:
            Formatted console string
        """
        lines = []
        lines.append("=" * 60)
        lines.append("PREDICTIVE SUGGESTIONS")
        lines.append("=" * 60)
        lines.append("")

        if report.suggestions:
            for i, suggestion in enumerate(report.suggestions[:self.max_suggestions], 1):
                lines.append(f"{i}. {suggestion.description}")
                if suggestion.rationale:
                    lines.append(f"   ({suggestion.rationale})")
                lines.append(f"   Confidence: {suggestion.confidence:.0%}")
                if suggestion.files:
                    files_str = ", ".join(suggestion.files[:2])
                    lines.append(f"   Files: {files_str}")
                lines.append("")
        else:
            lines.append("No suggestions available at this time.")
            lines.append("")

        if report.workflow_prediction:
            lines.append("-" * 60)
            lines.append("WORKFLOW PREDICTION")
            lines.append("-" * 60)
            lines.append(f"Pattern: {report.workflow_prediction.workflow_name}")
            lines.append(f"Next: {', '.join(report.workflow_prediction.predicted_steps[:3])}")
            lines.append("")

        if report.timing_suggestion:
            lines.append("-" * 60)
            lines.append("TIMING OPTIMIZATION")
            lines.append("-" * 60)
            lines.append(f"{report.timing_suggestion.rationale}")
            lines.append("")

        return "\n".join(lines)

    def format_for_claude_code(
        self,
        report: PredictionReport
    ) -> Dict[str, Any]:
        """Format predictions for Claude Code interpretation.

        Creates structured data that Claude Code can reason about.

        Args:
            report: Prediction report to format

        Returns:
            Structured dictionary for Claude Code
        """
        return {
            "predictions": {
                "generated_at": report.generated_at.isoformat(),
                "suggestions": [
                    {
                        "description": s.description,
                        "command": s.command,
                        "files": s.files,
                        "confidence": s.confidence,
                        "urgency": s.urgency.value,
                        "rationale": s.rationale,
                        "suggestion_type": s.suggestion_type.value
                    }
                    for s in report.suggestions[:self.max_suggestions]
                ],
                "workflow": {
                    "name": report.workflow_prediction.workflow_name if report.workflow_prediction else None,
                    "next_steps": report.workflow_prediction.predicted_steps if report.workflow_prediction else [],
                    "confidence": report.workflow_prediction.confidence if report.workflow_prediction else 0.0
                },
                "timing": {
                    "activity_type": report.timing_suggestion.activity_type if report.timing_suggestion else None,
                    "current_score": report.timing_suggestion.current_score if report.timing_suggestion else 0.0,
                    "optimal_hours": report.timing_suggestion.optimal_hours if report.timing_suggestion else []
                },
                "context": {
                    "time_of_day": report.context.time_of_day if report.context else 0,
                    "day_of_week": report.context.day_of_week if report.context else 0,
                    "session_phase": report.context.session_phase if report.context else "unknown",
                    "recent_commands": report.context.recent_commands[-5:] if report.context else []
                }
            },
            "metadata": report.metadata
        }

    def format_session_start_for_console(
        self,
        recommendation: SessionStartRecommendation
    ) -> str:
        """Format session start recommendations for console.

        Args:
            recommendation: Session start recommendation

        Returns:
            Formatted console string
        """
        lines = []
        lines.append("=" * 60)
        lines.append("SESSION START RECOMMENDATIONS")
        lines.append("=" * 60)
        lines.append("")

        # Session goal suggestions
        if recommendation.session_goal_suggestions:
            lines.append("Suggested session goals:")
            for goal in recommendation.session_goal_suggestions:
                lines.append(f"  • {goal}")
            lines.append("")

        # High-value suggestions
        if recommendation.high_value_suggestions:
            lines.append("Top priority actions:")
            for i, sugg in enumerate(recommendation.high_value_suggestions[:5], 1):
                lines.append(f"  {i}. {sugg.description} ({sugg.confidence:.0%})")
            lines.append("")

        # Incomplete workflows
        if recommendation.incomplete_workflows:
            lines.append("Continue incomplete workflows:")
            for workflow in recommendation.incomplete_workflows[:3]:
                lines.append(f"  • {workflow.workflow_name}")
                if workflow.predicted_steps:
                    steps_str = " → ".join(workflow.predicted_steps[:2])
                    lines.append(f"    Next: {steps_str}")
            lines.append("")

        # Active file areas
        if recommendation.active_file_clusters:
            lines.append("Active work areas:")
            unique_files = list(set(recommendation.active_file_clusters))[:5]
            for file in unique_files:
                short_name = file.split("/")[-1]
                lines.append(f"  • {short_name}")
            lines.append("")

        # Timing context
        if recommendation.time_based_context:
            timing = recommendation.time_based_context
            lines.append("Timing context:")
            lines.append(f"  Current hour score: {timing.current_score:.0%}")
            if timing.optimal_hours:
                optimal_str = ", ".join(f"{h}:00" for h in timing.optimal_hours[:3])
                lines.append(f"  Optimal hours: {optimal_str}")
            lines.append("")

        return "\n".join(lines)

    def format_as_json(
        self,
        report: PredictionReport,
        pretty: bool = True
    ) -> str:
        """Format predictions as JSON.

        Args:
            report: Prediction report to format
            pretty: Whether to pretty-print JSON

        Returns:
            JSON string
        """
        import json

        data = {
            "generated_at": report.generated_at.isoformat(),
            "suggestions": [s.to_dict() for s in report.suggestions],
            "workflow": report.workflow_prediction.to_dict() if report.workflow_prediction else None,
            "timing": report.timing_suggestion.to_dict() if report.timing_suggestion else None,
            "session_start": report.session_start.to_dict() if report.session_start else None,
            "context": report.context.to_dict() if report.context else None,
            "metadata": report.metadata
        }

        if pretty:
            return json.dumps(data, indent=2)
        return json.dumps(data)

    def truncate_for_bloat_prevention(
        self,
        content: str,
        max_lines: int
    ) -> str:
        """Truncate content to prevent bloat in memory.md.

        Args:
            content: Content to truncate
            max_lines: Maximum lines to keep

        Returns:
            Truncated content
        """
        lines = content.split("\n")
        if len(lines) <= max_lines:
            return content

        # Keep header and first N suggestions
        kept = lines[:max_lines - 2]
        kept.append("")
        kept.append("_(Additional suggestions omitted to prevent bloat)_")

        return "\n".join(kept)

    def format_acceptance_summary(
        self,
        acceptance_rate: float,
        total_shown: int,
        period_days: int
    ) -> str:
        """Format acceptance rate summary for display.

        Args:
            acceptance_rate: Acceptance rate (0.0 to 1.0)
            total_shown: Total predictions shown
            period_days: Period for metrics

        Returns:
            Formatted summary string
        """
        percentage = acceptance_rate * 100

        if percentage >= 60:
            emoji = ""
            assessment = "Good accuracy"
        elif percentage >= 40:
            emoji = ""
            assessment = "Moderate accuracy"
        else:
            emoji = ""
            assessment = "Low accuracy - still learning"

        return (
            f"Prediction accuracy (last {period_days}d): {percentage:.0f}% {emoji}\n"
            f"_{assessment}_ ({total_shown} suggestions shown)"
        )
