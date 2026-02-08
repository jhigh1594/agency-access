"""
MemoryIntegrator - Updates memory.md with pattern insights and predictions.

Responsibilities:
- Insert pattern insights into memory.md
- Insert predictive suggestions into memory.md
- Maintain pattern history section
- Prevent bloat (rotate old insights to archive)
- Generate session-start context summary
"""

import logging
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, Optional, List

from .insight_generator import InsightGenerator
from .pattern_models import PatternReport
from .prediction_models import ActionSuggestion, PredictionReport

# Phase 4: Executive Intelligence imports
from .executive_models import ExecutiveInsightReport

logger = logging.getLogger(__name__)


class MemoryIntegrator:
    """Integrates pattern insights and predictions into the memory system.

    Updates memory.md with Pattern Insights and Suggested Actions sections
    while preventing file bloat through intelligent rotation.
    """

    # Section markers for pattern insights
    INSIGHTS_SECTION_START = "## Pattern Insights"
    PREDICTIONS_SECTION_START = "## Suggested Actions"
    EXECUTIVE_SECTION_START = "## Executive Insights"
    SECTION_END = "##"  # Next section marker

    # Maximum lines for sections (bloat prevention)
    MAX_INSIGHTS_LINES = 50
    MAX_PREDICTIONS_LINES = 40
    MAX_EXECUTIVE_LINES = 60

    def __init__(self, workspace_root: Path):
        """Initialize with workspace path.

        Args:
            workspace_root: Path to workspace root directory
        """
        self.workspace_root = workspace_root
        self.memory_path = workspace_root / "memory-bank" / "memory.md"

    async def update_memory(self, insights_output: Dict[str, Any]) -> bool:
        """Update memory.md with pattern insights and predictions.

        Args:
            insights_output: Output containing:
                - patterns: PatternReport with detected patterns
                - insights: InsightReport with formatted summaries
                - predictions: PredictionReport with suggestions (optional)
                - executive_report: ExecutiveInsightReport (optional)

        Returns:
            True if update successful, False otherwise
        """
        try:
            # Check if memory.md exists
            if not self.memory_path.exists():
                logger.warning(f"Memory file not found: {self.memory_path}")
                return False

            # Extract data
            pattern_report = insights_output.get("patterns")
            insight_report = insights_output.get("insights")
            predictions = insights_output.get("predictions", {})
            executive_report = insights_output.get("executive_report")

            if not pattern_report or not insight_report:
                logger.warning("No pattern or insight data to integrate")
                return False

            # Read current memory
            current_content = self.memory_path.read_text()

            # Generate insights section
            insights_section = self._generate_insights_section(pattern_report, insight_report)

            # Update memory content with insights
            updated_content = self._insert_or_replace_insights_section(
                current_content,
                insights_section
            )

            # Add predictions section if available
            if predictions:
                predictions_section = self._generate_predictions_section(predictions)
                updated_content = self._insert_or_replace_predictions_section(
                    updated_content,
                    predictions_section
                )

            # Add executive section if available (Phase 4)
            if executive_report:
                executive_section = await self._generate_executive_section(executive_report)
                updated_content = self._insert_or_replace_executive_section(
                    updated_content,
                    executive_section
                )

            # Check for bloat and trim if needed
            updated_content = self._prevent_bloat(updated_content)

            # Write updated content
            self.memory_path.write_text(updated_content)

            logger.info(f"Updated memory.md with insights and predictions")
            return True

        except Exception as e:
            logger.error(f"Failed to update memory: {e}")
            return False

    def _generate_insights_section(
        self,
        pattern_report: PatternReport,
        insight_report: Any
    ) -> str:
        """Generate the pattern insights section content.

        Args:
            pattern_report: PatternReport with detected patterns
            insight_report: InsightReport with formatted summaries

        Returns:
            Markdown-formatted insights section
        """
        lines = [
            self.SECTION_START,
            ""
        ]

        # Add formatted summary from InsightGenerator
        if hasattr(insight_report, 'formatted_summary'):
            lines.append(insight_report.formatted_summary)
        else:
            # Fallback: generate basic summary
            generator = InsightGenerator(self.workspace_root)
            summary = generator._format_summary_display(pattern_report)
            lines.append(summary)

        # Ensure section ends with blank line
        if not lines[-1]:
            lines.append("")

        return "\n".join(lines)

    def _generate_predictions_section(self, predictions: Dict[str, Any]) -> str:
        """Generate the suggested actions section content.

        Args:
            predictions: Dictionary containing prediction data

        Returns:
            Markdown-formatted predictions section
        """
        lines = [
            self.PREDICTIONS_SECTION_START,
            ""
        ]

        # Add timestamp
        timestamp = datetime.now().strftime("%H:%M on %Y-%m-%d")
        lines.append(f"_Generated {timestamp}_")
        lines.append("")

        current_lines = 3

        # Extract suggestions from predictions dict
        suggestions = predictions.get("suggestions", [])
        if not isinstance(suggestions, list):
            # Handle case where suggestions might be serialized
            suggestions = []

        # Add suggestions
        for suggestion in suggestions[:5]:
            if hasattr(suggestion, 'description'):
                # ActionSuggestion object
                description = suggestion.description
                confidence = getattr(suggestion, 'confidence', 0)
                rationale = getattr(suggestion, 'rationale', None)
            else:
                # Dictionary format
                description = suggestion.get('description', 'Unknown action')
                confidence = suggestion.get('confidence', 0)
                rationale = suggestion.get('rationale')

            # Format confidence
            confidence_str = f" ({confidence:.0%})" if confidence > 0 else ""

            # Urgency emoji
            urgency = getattr(suggestion, 'urgency', None)
            emoji = "" if hasattr(urgency, 'value') and urgency.value == "high" else ""

            lines.append(f"{emoji} **{description}**{confidence_str}")

            # Add rationale if available
            if rationale:
                lines.append(f"  _{rationale}_")

            lines.append("")
            current_lines += 3

            # Prevent bloat
            if current_lines >= self.MAX_PREDICTIONS_LINES - 5:
                lines.append("_(Additional suggestions omitted to prevent bloat)_")
                lines.append("")
                break

        # Add workflow prediction if available
        workflow = predictions.get("workflow")
        if workflow and current_lines < self.MAX_PREDICTIONS_LINES - 8:
            lines.append("")
            if hasattr(workflow, 'workflow_name'):
                lines.append("**Incomplete Workflow Detected**")
                lines.append("")
                lines.append(f"Workflow: {workflow.workflow_name}")
                if hasattr(workflow, 'predicted_steps') and workflow.predicted_steps:
                    lines.append("Next steps:")
                    for step in workflow.predicted_steps[:3]:
                        lines.append(f"  1. {step}")
                lines.append("")

        # Add timing suggestion if current time is suboptimal
        timing = predictions.get("timing")
        if timing and hasattr(timing, 'current_score') and timing.current_score < 0.6:
            lines.append("")
            if hasattr(timing, 'activity_type'):
                lines.append(f"**Timing Note: {timing.activity_type}**")
                lines.append("")
                if hasattr(timing, 'rationale'):
                    lines.append(f"_{timing.rationale}_")
                lines.append("")

        return "\n".join(lines)

    def _insert_or_replace_insights_section(self, content: str, new_section: str) -> str:
        """Insert or replace the pattern insights section.

        Args:
            content: Current memory.md content
            new_section: New section content to insert

        Returns:
            Updated content with section inserted/replaced
        """
        lines = content.split("\n")
        section_start = self.INSIGHTS_SECTION_START

        # Check if section exists
        section_start_idx = None
        section_end_idx = None

        for i, line in enumerate(lines):
            if line.strip() == section_start:
                section_start_idx = i
            elif section_start_idx is not None and self._is_next_section_header(line):
                section_end_idx = i
                break

        # Insert or replace
        if section_start_idx is not None:
            # Replace existing section
            if section_end_idx is not None:
                new_lines = (
                    lines[:section_start_idx] +
                    new_section.split("\n") +
                    lines[section_end_idx:]
                )
            else:
                new_lines = lines[:section_start_idx] + new_section.split("\n")
        else:
            # Insert at end
            new_lines = lines + new_section.split("\n")

        return "\n".join(new_lines)

    def _insert_or_replace_predictions_section(self, content: str, new_section: str) -> str:
        """Insert or replace the suggested actions section.

        Args:
            content: Current memory.md content
            new_section: New section content to insert

        Returns:
            Updated content with section inserted/replaced
        """
        lines = content.split("\n")
        section_start = self.PREDICTIONS_SECTION_START

        # Check if section exists
        section_start_idx = None
        section_end_idx = None

        for i, line in enumerate(lines):
            if line.strip() == section_start:
                section_start_idx = i
            elif section_start_idx is not None and self._is_next_section_header(line):
                section_end_idx = i
                break

        # Insert or replace
        if section_start_idx is not None:
            # Replace existing section
            if section_end_idx is not None:
                new_lines = (
                    lines[:section_start_idx] +
                    new_section.split("\n") +
                    lines[section_end_idx:]
                )
            else:
                new_lines = lines[:section_start_idx] + new_section.split("\n")
        else:
            # Insert after insights section if it exists
            insights_idx = None
            for i, line in enumerate(lines):
                if line.strip() == self.INSIGHTS_SECTION_START:
                    insights_idx = i
                    # Find end of insights section
                    for j in range(i + 1, len(lines)):
                        if self._is_next_section_header(lines[j]):
                            insights_idx = j
                            break
                    break

            if insights_idx is not None:
                # Insert after insights section
                new_lines = (
                    lines[:insights_idx] +
                    [""] +
                    new_section.split("\n") +
                    lines[insights_idx:]
                )
            else:
                # Insert at end
                new_lines = lines + new_section.split("\n")

        return "\n".join(new_lines)

    def _insert_or_replace_section(self, content: str, new_section: str) -> str:
        """Insert or replace the pattern insights section.

        Args:
            content: Current memory.md content
            new_section: New section content to insert

        Returns:
            Updated content with section inserted/replaced
        """
        lines = content.split("\n")

        # Check if section exists
        section_start_idx = None
        section_end_idx = None

        for i, line in enumerate(lines):
            if line.strip() == self.SECTION_START:
                section_start_idx = i
            elif section_start_idx is not None and line.strip().startswith("##"):
                section_end_idx = i
                break

        # Insert or replace
        if section_start_idx is not None:
            # Replace existing section
            if section_end_idx is not None:
                # Replace between markers
                new_lines = (
                    lines[:section_start_idx] +
                    new_section.split("\n") +
                    lines[section_end_idx:]
                )
            else:
                # Replace to end of file
                new_lines = (
                    lines[:section_start_idx] +
                    new_section.split("\n")
                )
        else:
            # Insert at end (before potential EOF)
            new_lines = lines + new_section.split("\n")

        return "\n".join(new_lines)

    def _prevent_bloat(self, content: str) -> str:
        """Prevent memory.md from growing too large.

        Trims both the pattern insights and predictions sections if they exceed limits.

        Args:
            content: Current memory.md content

        Returns:
            Trimmed content within size limits
        """
        lines = content.split("\n")

        # Trim predictions section first (more likely to grow)
        lines = self._trim_section(
            lines,
            self.PREDICTIONS_SECTION_START,
            self.MAX_PREDICTIONS_LINES,
            "predictions"
        )

        # Trim insights section
        lines = self._trim_section(
            lines,
            self.INSIGHTS_SECTION_START,
            self.MAX_INSIGHTS_LINES,
            "insights"
        )

        return "\n".join(lines)

    def _trim_section(
        self,
        lines: List[str],
        section_start: str,
        max_lines: int,
        section_type: str
    ) -> List[str]:
        """Trim a specific section to prevent bloat.

        Args:
            lines: All content lines
            section_start: Section start marker
            max_lines: Maximum lines for this section
            section_type: Type identifier for messages

        Returns:
            Updated lines with section trimmed if needed
        """
        # Find section boundaries
        section_start_idx = None
        section_end_idx = None

        for i, line in enumerate(lines):
            if line.strip() == section_start:
                section_start_idx = i
            elif section_start_idx is not None and self._is_next_section_header(line):
                section_end_idx = i
                break

        if section_start_idx is None:
            return lines  # No section to trim

        # Check section size
        if section_end_idx is None:
            section_end_idx = len(lines)

        section_size = section_end_idx - section_start_idx

        if section_size <= max_lines:
            return lines  # Within limits

        # Trim section - keep most recent content
        # Find the divider line (---) and keep content after it
        divider_idx = None
        for i in range(section_start_idx, section_end_idx):
            if lines[i].strip() == "---":
                divider_idx = i
                break

        keep_lines = max(15, max_lines - 5)  # Keep last 15 lines or section limit

        if divider_idx and (section_end_idx - divider_idx) > keep_lines:
            # Keep header + last N lines of section
            keep_from = max(divider_idx, section_end_idx - keep_lines)
            trimmed_lines = (
                lines[:section_start_idx] +
                lines[section_start_idx:divider_idx + 1] +  # Keep header
                ["", f"*(Older {section_type} archived)*", ""] +
                lines[keep_from:section_end_idx] +
                lines[section_end_idx:]
            )
            return trimmed_lines

        return lines

    def _is_next_section_header(self, line: str) -> bool:
        """Check if line is a level-2 header (next section).

        Must be exactly "##" not "###" or higher.

        Args:
            line: Line to check

        Returns:
            True if line is a level-2 markdown header
        """
        stripped = line.strip()
        # Match exactly "##" followed by space, not "###" or higher
        return stripped.startswith("## ") and not stripped.startswith("###")

    def get_session_context(self, max_words: int = 150) -> Optional[str]:
        """Get pattern insights summary for session-start context.

        Provides a brief summary of recent patterns for AI assistants
        at session start.

        Args:
            max_words: Maximum words in summary

        Returns:
            Brief pattern context or None
        """
        try:
            if not self.memory_path.exists():
                return None

            content = self.memory_path.read_text()

            # Find pattern insights section
            start_idx = content.find(self.SECTION_START)
            if start_idx == -1:
                return None

            # Extract section (up to next ## or end)
            end_idx = content.find("\n##", start_idx + 1)
            if end_idx == -1:
                end_idx = len(content)

            section = content[start_idx:end_idx]

            # Create brief summary
            lines = section.split("\n")
            summary_lines = []

            for line in lines:
                line = line.strip()
                # Skip headers and empty lines
                if not line or line.startswith("#") or line.startswith("*"):
                    continue
                if line.startswith("-"):
                    summary_lines.append(line)
                    if len(" ".join(summary_lines)) > max_words * 5:
                        break

            if summary_lines:
                return "Recent patterns:\n" + "\n".join(summary_lines[:5])

            return None

        except Exception as e:
            logger.error(f"Failed to get session context: {e}")
            return None

    def archive_old_patterns(self, days: int = 30) -> bool:
        """Archive pattern insights older than specified days.

        Creates an archive file with historical pattern data.

        Args:
            days: Age threshold for archiving

        Returns:
            True if successful
        """
        try:
            archive_path = self.workspace_root / "memory-bank" / "pattern-archive.md"
            archive_path.parent.mkdir(parents=True, exist_ok=True)

            # This is a placeholder for future implementation
            # Could integrate with PatternStore to pull historical data

            logger.info(f"Pattern archiving not yet implemented")
            return False

        except Exception as e:
            logger.error(f"Failed to archive patterns: {e}")
            return False


def generate_session_summary(pattern_report: PatternReport) -> str:
    """Generate a brief session summary from patterns.

    Args:
        pattern_report: PatternReport to summarize

    Returns:
        Brief summary string
    """
    parts = []

    if pattern_report.time_patterns:
        tp = pattern_report.time_patterns
        if tp.peak_hours:
            parts.append(f"Peak hours: {tp.peak_hours_display}")

    if pattern_report.command_sequences:
        top_seq = pattern_report.command_sequences[0]
        parts.append(f"Common workflow: {top_seq}")

    if pattern_report.file_clusters:
        parts.append(f"{len(pattern_report.file_clusters)} file clusters")

    return " | ".join(parts) if parts else "No patterns detected yet"


    # =========================================================================
    # Phase 4: Executive Intelligence - Memory Integration Methods
    # =========================================================================

    async def _generate_executive_section(self, report: ExecutiveInsightReport) -> str:
        """Generate the executive insights section content.

        Args:
            report: ExecutiveInsightReport to format

        Returns:
            Markdown-formatted executive section
        """
        try:
            from .executive_synthesizer import ExecutiveSynthesizer

            synthesizer = ExecutiveSynthesizer(self.workspace_root)
            return await synthesizer.format_for_memory_md(report)

        except Exception as e:
            logger.error(f"Failed to generate executive section: {e}")
            # Fallback to basic format
            lines = [
                "## Executive Insights",
                "",
                f"*Updated: {datetime.now().strftime('%Y-%m-%d %H:%M')}*",
                "",
                "### Weekly Summary",
                f"• Productivity: {report.weekly_snapshot.productivity_score:.2f}",
                f"• Anomalies detected: {report.weekly_snapshot.anomalies_detected}",
                ""
            ]
            return "\n".join(lines)

    def _insert_or_replace_executive_section(self, content: str, new_section: str) -> str:
        """Insert or replace the executive insights section.

        Args:
            content: Current memory.md content
            new_section: New section content to insert

        Returns:
            Updated content with section inserted/replaced
        """
        lines = content.split("\n")
        section_start = self.EXECUTIVE_SECTION_START

        # Check if section exists
        section_start_idx = None
        section_end_idx = None

        for i, line in enumerate(lines):
            if line.strip() == section_start:
                section_start_idx = i
            elif section_start_idx is not None and self._is_next_section_header(line):
                section_end_idx = i
                break

        # Insert or replace
        if section_start_idx is not None:
            # Replace existing section
            if section_end_idx is not None:
                new_lines = (
                    lines[:section_start_idx] +
                    new_section.split("\n") +
                    lines[section_end_idx:]
                )
            else:
                new_lines = lines[:section_start_idx] + new_section.split("\n")
        else:
            # Insert after predictions section or at end
            predictions_idx = None
            for i, line in enumerate(lines):
                if line.strip() == self.PREDICTIONS_SECTION_START:
                    predictions_idx = i
                    # Find end of predictions section
                    for j in range(i + 1, len(lines)):
                        if self._is_next_section_header(lines[j]):
                            predictions_idx = j
                            break
                    break

            if predictions_idx is not None:
                # Insert after predictions section
                new_lines = (
                    lines[:predictions_idx] +
                    [""] +
                    new_section.split("\n") +
                    lines[predictions_idx:]
                )
            else:
                # Insert at end
                new_lines = lines + new_section.split("\n")

        return "\n".join(new_lines)
