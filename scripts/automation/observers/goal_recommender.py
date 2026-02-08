"""
Phase 4: Executive Intelligence - Goal-Aware Recommender

Connects patterns to DPD OKRs for strategic alignment and recommendations.

Key Methods:
- load_okrs(): Parse DPD OKRs from markdown file
- correlate_patterns_to_goals(): Map detected patterns to strategic objectives
- _infer_product_area_from_files(): Map file paths to product areas
"""

import logging
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

from .pattern_models import PatternReport, FileCluster, CommandSequence
from .executive_models import (
    GoalCorrelation,
    ProgressIndicator,
)

logger = logging.getLogger(__name__)


class GoalAwareRecommender:
    """Generates goal-aware recommendations using OKR context.

    Maps user activity patterns to DPD strategic objectives for alignment tracking.
    Uses graceful degradation when OKR file is unavailable.

    DPD 2026 OKRs:
    1. Decisions Improve as Work Happens
    2. One Cohesive DPD Experience
    3. Outcomes are Visible, Predictable, and Managed
    4. AI is Embedded in the Flow of Work
    """

    # OKR definitions (fallback if file unavailable)
    DEFAULT_OKRS = {
        "obj1": {
            "title": "Decisions Improve as Work Happens",
            "keywords": ["dependency", "risk", "capacity", "dynamic planning", "real-time"],
            "file_patterns": ["Products/DPD/", "Products/AgilePlace/"],
            "commands": ["/today", "/commit"]
        },
        "obj2": {
            "title": "One Cohesive DPD Experience",
            "keywords": ["cohesive", "integration", "unified", "onboarding", "experience"],
            "file_patterns": ["Products/Roadmaps/", "Products/OKRs/"],
            "commands": ["/brainstorm", "/prd"]
        },
        "obj3": {
            "title": "Outcomes are Visible, Predictable, and Managed",
            "keywords": ["outcome", "visible", "predictable", "executive", "tracking"],
            "file_patterns": ["memory-bank/", "Docs/memos/"],
            "commands": ["/today", "memory"]
        },
        "obj4": {
            "title": "AI is Embedded in the Flow of Work",
            "keywords": ["ai", "automation", "claude", "anvi", "embedded"],
            "file_patterns": ["scripts/automation/", ".claude/"],
            "commands": ["/commit", "/brainstorm"]
        }
    }

    def __init__(self, workspace_root: Path, config: Optional[Dict[str, Any]] = None):
        """Initialize the goal-aware recommender.

        Args:
            workspace_root: Path to workspace root directory
            config: Optional configuration dictionary
        """
        self.workspace_root = workspace_root
        self.config = config or {}

        # OKR file path
        self.okr_path = workspace_root / "Products" / "DPD" / "product-context" / "2026-DPD-OKRs-and-Capabilities.md"

        # Configuration
        goal_config = self.config.get("goal_recommendations", {})
        self.min_alignment_score = goal_config.get("min_alignment_score", 0.3)
        self.max_correlations_per_okr = goal_config.get("max_correlations_per_okr", 3)

        # Cached OKRs
        self._okrs: Optional[Dict[str, Any]] = None

    async def load_okrs(self) -> Dict[str, Any]:
        """Parse DPD OKRs from markdown file.

        Returns 4 objectives:
        1. Decisions Improve as Work Happens
        2. One Cohesive DPD Experience
        3. Outcomes are Visible, Predictable, and Managed
        4. AI is Embedded in the Flow of Work

        Graceful degradation: Returns DEFAULT_OKRS if file unavailable.

        Returns:
            Dictionary with OKR definitions
        """
        if self._okrs is not None:
            return self._okrs

        try:
            if not self.okr_path.exists():
                logger.warning(f"OKR file not found: {self.okr_path}, using defaults")
                self._okrs = self.DEFAULT_OKRS
                return self._okrs

            content = self.okr_path.read_text()
            okrs = {}

            # Parse the markdown file
            current_obj = None
            current_key = None
            key_counter = 1

            for line in content.split("\n"):
                line = line.strip()

                # Match objective headers
                if line.startswith("## Objective ") and ":" in line:
                    # Store previous objective
                    if current_obj and current_key:
                        okrs[current_key] = current_obj

                    # Start new objective
                    current_key = f"obj{key_counter}"
                    key_counter += 1
                    title = line.split(":", 1)[1].strip() if ":" in line else line
                    current_obj = {
                        "title": title,
                        "keywords": [],
                        "key_results": [],
                        "file_patterns": [],
                        "commands": []
                    }

                # Match key results
                elif line.startswith("-") and line[1:].strip().startswith("Increase"):
                    if current_obj:
                        key_result = line[1:].strip()
                        current_obj["key_results"].append(key_result)
                        # Extract keywords from key result
                        self._extract_keywords_from_key_result(key_result, current_obj)

            # Store last objective
            if current_obj and current_key:
                okrs[current_key] = current_obj

            if okrs:
                self._okrs = okrs
                logger.info(f"Loaded {len(okrs)} OKRs from file")
            else:
                self._okrs = self.DEFAULT_OKRS
                logger.warning("No OKRs parsed, using defaults")

            return self._okrs

        except Exception as e:
            logger.error(f"Failed to load OKRs: {e}, using defaults")
            self._okrs = self.DEFAULT_OKRS
            return self._okrs

    def _extract_keywords_from_key_result(self, key_result: str, obj: Dict[str, Any]) -> None:
        """Extract keywords from a key result string.

        Args:
            key_result: Key result text
            obj: Objective dictionary to update
        """
        # Add key result as a keyword source
        words = key_result.lower().split()
        for word in words:
            if len(word) > 4:  # Only meaningful words
                obj["keywords"].append(word)

    async def correlate_patterns_to_goals(
        self,
        pattern_report: PatternReport,
        recent_analysis: Optional[Any] = None
    ) -> List[GoalCorrelation]:
        """Map detected patterns to strategic objectives.

        Correlation logic:
        1. File clusters → Product areas (DPD, AgilePlace, OKRs, Roadmaps)
        2. Commands → Workflow types (analysis, execution, communication)
        3. Strategic alignment scores from today_cmd → Direct OKR mapping

        Args:
            pattern_report: PatternReport with detected patterns
            recent_analysis: Optional AnalyzedData from today_cmd

        Returns:
            List of GoalCorrelation objects
        """
        logger.info("Correlating patterns to DPD OKRs...")

        okrs = await self.load_okrs()
        correlations = []

        # Build file paths from pattern report
        file_paths = []
        for cluster in pattern_report.file_clusters:
            file_paths.extend(cluster.files)

        # Build command list from pattern report
        commands = []
        for seq in pattern_report.command_sequences:
            commands.extend(seq.sequence)

        # Get strategic alignment if available
        alignment_score = 0.5  # Default
        if recent_analysis and hasattr(recent_analysis, 'strategic_alignment'):
            alignment_score = recent_analysis.strategic_alignment

        # Correlate each OKR
        for okr_id, okr in okrs.items():
            aligned_patterns = []
            alignment_factors = []

            # Check file path correlations
            for file_path in file_paths:
                for pattern in okr.get("file_patterns", []):
                    if pattern in file_path:
                        aligned_patterns.append(f"file:{file_path}")
                        alignment_factors.append(0.3)  # File match contributes 30%
                        break

            # Check command correlations
            for command in commands:
                command_clean = command.lstrip("/")
                for pattern in okr.get("commands", []):
                    if pattern in command_clean:
                        aligned_patterns.append(f"cmd:{command_clean}")
                        alignment_factors.append(0.2)  # Command match contributes 20%
                        break

            # Check keyword correlations in file paths
            for keyword in okr.get("keywords", []):
                for file_path in file_paths:
                    if keyword.lower() in file_path.lower():
                        if f"kw:{keyword}" not in aligned_patterns:
                            aligned_patterns.append(f"kw:{keyword}")
                            alignment_factors.append(0.1)  # Keyword contributes 10%
                        break

            # Calculate alignment score
            if alignment_factors:
                raw_score = sum(alignment_factors)
                alignment_score = min(1.0, raw_score)
            else:
                alignment_score = 0.0

            # Only include if meets minimum threshold
            if alignment_score >= self.min_alignment_score:
                # Determine progress indicator
                progress = self._determine_progress_indicator(
                    alignment_score,
                    len(aligned_patterns),
                    pattern_report
                )

                # Generate recommendations
                recommendations = self._generate_goal_recommendations(
                    okr_id,
                    okr,
                    aligned_patterns,
                    alignment_score
                )

                correlation = GoalCorrelation(
                    okr_id=okr_id,
                    okr_title=okr["title"],
                    aligned_patterns=aligned_patterns[:self.max_correlations_per_okr],
                    alignment_score=alignment_score,
                    progress_indicator=progress,
                    recommendations=recommendations,
                    evidence_count=len(aligned_patterns),
                    last_activity=datetime.now()
                )

                correlations.append(correlation)

        # Sort by alignment score
        correlations.sort(key=lambda c: c.alignment_score, reverse=True)

        logger.info(f"Generated {len(correlations)} goal correlations")
        return correlations

    def _determine_progress_indicator(
        self,
        alignment_score: float,
        pattern_count: int,
        pattern_report: PatternReport
    ) -> ProgressIndicator:
        """Determine progress status for a goal correlation.

        Args:
            alignment_score: Calculated alignment score
            pattern_count: Number of aligned patterns
            pattern_report: Pattern report for context

        Returns:
            ProgressIndicator enum value
        """
        # High alignment with recent activity = on track
        if alignment_score >= 0.7:
            return ProgressIndicator.ON_TRACK

        # Medium alignment = at risk
        if alignment_score >= 0.4:
            return ProgressIndicator.AT_RISK

        # Low alignment = behind
        return ProgressIndicator.BEHIND

    def _generate_goal_recommendations(
        self,
        okr_id: str,
        okr: Dict[str, Any],
        aligned_patterns: List[str],
        alignment_score: float
    ) -> List[str]:
        """Generate recommendations for improving goal alignment.

        Args:
            okr_id: OKR identifier
            okr: OKR definition
            aligned_patterns: List of aligned patterns
            alignment_score: Current alignment score

        Returns:
            List of actionable recommendations
        """
        recommendations = []

        # Generate recommendations based on alignment score
        if alignment_score < 0.4:
            recommendations.append(
                f"Low alignment with '{okr['title']}' - consider prioritizing related work"
            )

        # Generate recommendations based on OKR-specific keywords
        if "dependency" in okr.get("keywords", []):
            recommendations.append(
                "Focus on dependency management work to improve alignment"
            )

        if "ai" in okr.get("keywords", []):
            recommendations.append(
                "Increase AI/automation work to improve alignment"
            )

        if "outcome" in okr.get("keywords", []):
            recommendations.append(
                "Ensure work connects to measurable outcomes"
            )

        # Add specific action based on aligned patterns
        if aligned_patterns:
            top_pattern = aligned_patterns[0]
            if top_pattern.startswith("file:"):
                recommendations.append(
                    f"Continue work in: {top_pattern[5:]}"
                )
            elif top_pattern.startswith("cmd:"):
                recommendations.append(
                    f"Leverage workflow: {top_pattern[4:]}"
                )

        return recommendations[:3]  # Limit to 3 recommendations

    def _infer_product_area_from_files(self, file_paths: List[str]) -> List[str]:
        """Map file paths to product areas.

        Products/DPD/* → Objective 1 (Decisions Improve)
        Products/OKRs/* → Objective 1 or 3 (Outcomes)
        Products/Roadmaps/* → Objective 2 (Cohesive Experience)
        memory-bank/* → Objective 3 (Outcomes Visible)
        scripts/automation/* → Objective 4 (AI Embedded)

        Args:
            file_paths: List of file paths to analyze

        Returns:
            List of product area identifiers
        """
        areas = []

        for file_path in file_paths:
            if "Products/DPD/" in file_path:
                areas.append("DPD")
            elif "Products/OKRs/" in file_path:
                areas.append("OKRs")
            elif "Products/Roadmaps/" in file_path:
                areas.append("Roadmaps")
            elif "Products/AgilePlace/" in file_path:
                areas.append("AgilePlace")
            elif "memory-bank/" in file_path:
                areas.append("Memory")
            elif "scripts/automation/" in file_path:
                areas.append("Automation")

        return list(set(areas))  # Unique areas

    async def get_goal_progress_summary(self, correlations: List[GoalCorrelation]) -> str:
        """Generate a human-readable summary of goal progress.

        Args:
            correlations: List of goal correlations

        Returns:
            Formatted summary string
        """
        if not correlations:
            return "No goal correlations available."

        lines = ["## Strategic Alignment Summary", ""]

        for correlation in correlations[:4]:  # Top 4 goals
            # Progress emoji
            if correlation.progress_indicator == ProgressIndicator.ON_TRACK:
                emoji = "✅"
            elif correlation.progress_indicator == ProgressIndicator.AT_RISK:
                emoji = "⚠️"
            else:
                emoji = "🔴"

            lines.append(f"{emoji} **{correlation.okr_title}**")
            lines.append(f"   Alignment: {correlation.alignment_score:.0%}")

            if correlation.aligned_patterns:
                lines.append(f"   Active work: {len(correlation.aligned_patterns)} aligned patterns")

            if correlation.recommendations:
                lines.append(f"   Recommendation: {correlation.recommendations[0]}")

            lines.append("")

        return "\n".join(lines)

    def get_strategic_guidance(self, okr_id: str) -> Optional[str]:
        """Get strategic guidance for a specific OKR.

        Args:
            okr_id: OKR identifier (e.g., "obj1")

        Returns:
            Strategic guidance text or None
        """
        guidance_map = {
            "obj1": "Focus on connecting decisions to real-time data. "
                    "Use dependency visibility and capacity signals for planning.",
            "obj2": "Emphasize cohesive DPD experience. "
                    "Highlight integrations between products and unified workflows.",
            "obj3": "Ensure outcomes are visible and trackable. "
                    "Connect work to measurable business results.",
            "obj4": "Leverage AI capabilities in daily workflows. "
                    "Use automation to reduce friction and improve productivity."
        }

        return guidance_map.get(okr_id)
