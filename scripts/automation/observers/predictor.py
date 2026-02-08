"""
Phase 3: Predictive Suggestions - Pattern Predictor Engine

This module implements statistical prediction algorithms for suggesting next actions,
workflow completion, optimal timing, and session start recommendations.

Design Principle: Statistical-first with AI enhancement. Uses Markov chains,
frequency analysis, and time-based scoring without requiring external AI.
Works fully standalone, enhanced with Claude Code when available.
"""

import sqlite3
import json
import hashlib
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple
from collections import Counter, defaultdict
import statistics

from .prediction_models import (
    ActionSuggestion,
    WorkflowPrediction,
    TimingSuggestion,
    SessionStartRecommendation,
    PredictionContext,
    SuggestionType,
    Urgency,
    PredictionReport
)
from .prediction_store import PredictionStore


class PatternPredictor:
    """Statistical prediction engine for user action patterns."""

    def __init__(self, db_path: str, workspace_root: str = ""):
        """Initialize the pattern predictor.

        Args:
            db_path: Path to patterns.db database
            workspace_root: Root directory of workspace
        """
        self.db_path = db_path
        self.workspace_root = workspace_root or str(Path.cwd())
        self.store = PredictionStore(db_path)

    async def predict_next_actions(
        self,
        context: PredictionContext,
        max_suggestions: int = 5,
        min_confidence: float = 0.3
    ) -> List[ActionSuggestion]:
        """Generate next-action predictions based on context.

        Uses multiple prediction strategies:
        1. Markov chain command prediction
        2. File cluster co-occurrence
        3. Workflow completion
        4. Time-based activity patterns

        Args:
            context: Current prediction context
            max_suggestions: Maximum number of suggestions to return
            min_confidence: Minimum confidence threshold

        Returns:
            List of action suggestions ranked by confidence
        """
        suggestions = []

        # Strategy 1: Command sequence prediction (Markov chain)
        command_suggestions = await self._predict_next_command(context)
        suggestions.extend(command_suggestions)

        # Strategy 2: File-related suggestions
        file_suggestions = await self._suggest_related_files(context)
        suggestions.extend(file_suggestions)

        # Strategy 3: Workflow completion
        workflow = await self.suggest_workflow_completion(context.recent_commands)
        if workflow and workflow.predicted_steps:
            for step in workflow.predicted_steps[:2]:
                suggestions.append(ActionSuggestion(
                    suggestion_id=self._generate_suggestion_id(),
                    suggestion_type=SuggestionType.WORKFLOW_COMPLETION,
                    description=f"Continue {workflow.workflow_name}: {step}",
                    command=step,
                    confidence=workflow.confidence * 0.9,
                    urgency=Urgency.MEDIUM,
                    rationale=f"Based on workflow pattern: {workflow.workflow_name}"
                ))

        # Strategy 4: Time-based suggestions
        timing = await self.suggest_optimal_timing("general")
        if timing and timing.current_score < 0.5:
            # Current time not optimal - suggest waiting or changing activity
            suggestions.append(ActionSuggestion(
                suggestion_id=self._generate_suggestion_id(),
                suggestion_type=SuggestionType.OPTIMAL_TIMING,
                description=f"Consider {timing.activity_type} during optimal hours",
                confidence=1.0 - timing.current_score,
                urgency=Urgency.LOW,
                rationale=timing.rationale
            ))

        # Deduplicate and rank by confidence
        seen_commands = set()
        unique_suggestions = []
        for s in suggestions:
            cmd_key = (s.command, tuple(s.files))
            if cmd_key not in seen_commands and s.confidence >= min_confidence:
                seen_commands.add(cmd_key)
                unique_suggestions.append(s)

        # Sort by confidence and limit
        unique_suggestions.sort(key=lambda x: x.confidence, reverse=True)
        return unique_suggestions[:max_suggestions]

    async def _predict_next_command(
        self,
        context: PredictionContext
    ) -> List[ActionSuggestion]:
        """Predict next command using Markov chain analysis.

        Builds transition matrix from historical command sequences and
        scores candidates by frequency and recency.

        Args:
            context: Current prediction context

        Returns:
            List of command suggestions
        """
        if not context.recent_commands:
            return []

        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.row_factory = sqlite3.Row

                # Get command sequences from patterns
                cursor = conn.execute("""
                    SELECT sequence_data, frequency, last_seen
                    FROM command_sequences
                    ORDER BY frequency DESC, last_seen DESC
                    LIMIT 100
                """)

                transition_scores = defaultdict(int)
                total_count = 0

                for row in cursor.fetchall():
                    seq_data = json.loads(row["sequence_data"])
                    commands = seq_data.get("commands", [])
                    frequency = row["frequency"]

                    # Find sequences that start with recent commands
                    recent = context.recent_commands[-3:]  # Last 3 commands
                    for i in range(len(commands) - len(recent)):
                        if commands[i:i+len(recent)] == recent:
                            # Next command after the match
                            if i + len(recent) < len(commands):
                                next_cmd = commands[i + len(recent)]
                                # Score: frequency * recency bonus
                                recency_bonus = self._calculate_recency_bonus(row["last_seen"])
                                transition_scores[next_cmd] += frequency * (1 + recency_bonus)
                                total_count += frequency

                # Generate suggestions
                suggestions = []
                for cmd, score in sorted(transition_scores.items(), key=lambda x: x[1], reverse=True)[:5]:
                    confidence = min(score / max(total_count, 1), 1.0)
                    suggestions.append(ActionSuggestion(
                        suggestion_id=self._generate_suggestion_id(),
                        suggestion_type=SuggestionType.COMMAND_NEXT,
                        description=f"Run: {cmd}",
                        command=cmd,
                        confidence=confidence,
                        urgency=Urgency.MEDIUM,
                        rationale=f"Often follows {context.recent_commands[-1] if context.recent_commands else 'start'}"
                    ))

                return suggestions
        except Exception as e:
            print(f"Error predicting next command: {e}")
            return []

    async def _suggest_related_files(
        self,
        context: PredictionContext
    ) -> List[ActionSuggestion]:
        """Suggest related files based on cluster co-occurrence.

        Args:
            context: Current prediction context

        Returns:
            List of file-related suggestions
        """
        if not context.active_file_clusters:
            return []

        suggestions = []
        seen_files = set()

        for cluster in context.active_file_clusters[:3]:
            # Files currently being edited
            for file in cluster:
                seen_files.add(file)

            try:
                with sqlite3.connect(self.db_path) as conn:
                    conn.row_factory = sqlite3.Row

                    # Find files that co-occur with current cluster files
                    for file in cluster:
                        cursor = conn.execute("""
                            SELECT related_file, co_occurrence_count, last_seen_together
                            FROM file_co_occurrences
                            WHERE source_file = ?
                            ORDER BY co_occurrence_count DESC
                            LIMIT 5
                        """, (file,))

                        for row in cursor.fetchall():
                            related_file = row["related_file"]
                            if related_file in seen_files:
                                continue

                            co_count = row["co_occurrence_count"]
                            # Normalize confidence by typical co-occurrence counts
                            confidence = min(co_count / 10.0, 1.0)

                            suggestions.append(ActionSuggestion(
                                suggestion_id=self._generate_suggestion_id(),
                                suggestion_type=SuggestionType.FILE_RELATED,
                                description=f"Edit: {Path(related_file).name}",
                                files=[related_file],
                                confidence=confidence,
                                urgency=Urgency.LOW,
                                rationale=f"Often edited with {Path(file).name}"
                            ))
                            seen_files.add(related_file)
            except Exception as e:
                print(f"Error suggesting related files: {e}")
                continue

        # Sort and deduplicate
        unique = {}
        for s in suggestions:
            key = tuple(s.files) if s.files else s.description
            if key not in unique or s.confidence > unique[key].confidence:
                unique[key] = s

        return sorted(unique.values(), key=lambda x: x.confidence, reverse=True)[:3]

    async def suggest_workflow_completion(
        self,
        recent_commands: List[str]
    ) -> Optional[WorkflowPrediction]:
        """Predict remaining steps in a partially-executed workflow.

        Identifies common workflow patterns and suggests completion steps.

        Args:
            recent_commands: Recently executed commands

        Returns:
            Workflow prediction if pattern detected
        """
        if not recent_commands:
            return None

        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.row_factory = sqlite3.Row

                # Look for workflow patterns that start with recent commands
                cursor = conn.execute("""
                    SELECT pattern_name, commands, completion_rate, frequency
                    FROM workflow_patterns
                    WHERE frequency >= 3
                    ORDER BY frequency DESC, completion_rate DESC
                    LIMIT 20
                """)

                best_match = None
                best_score = 0

                for row in cursor.fetchall():
                    pattern_commands = json.loads(row["commands"])

                    # Check if recent commands match start of pattern
                    match_length = 0
                    for i, cmd in enumerate(recent_commands):
                        if i < len(pattern_commands) and cmd == pattern_commands[i]:
                            match_length += 1
                        else:
                            break

                    if match_length > 0 and match_length < len(pattern_commands):
                        # Calculate match score
                        score = (match_length / len(pattern_commands)) * row["frequency"]

                        if score > best_score:
                            best_score = score
                            remaining = pattern_commands[match_length:]

                            best_match = WorkflowPrediction(
                                workflow_name=row["pattern_name"],
                                completed_steps=recent_commands[-match_length:],
                                predicted_steps=remaining,
                                confidence=min(score / 100.0, 1.0),
                                estimated_remaining_steps=len(remaining),
                                common_patterns=[row["pattern_name"]]
                            )

                return best_match
        except Exception as e:
            print(f"Error predicting workflow completion: {e}")
            return None

    async def recommend_session_start(
        self,
        time_of_day: int,
        day_of_week: int,
        max_suggestions: int = 7
    ) -> SessionStartRecommendation:
        """Generate context-aware suggestions for starting a new session.

        Considers:
        - Incomplete workflows from previous session
        - Active file clusters
        - Time-based productivity patterns
        - Success correlations

        Args:
            time_of_day: Current hour (0-23)
            day_of_week: Current day (0=Monday, 6=Sunday)
            max_suggestions: Maximum suggestions to return

        Returns:
            Session start recommendation
        """
        # Build context
        context = await self.build_context(
            recent_events=[],
            current_time=datetime.now()
        )

        # Get incomplete workflows
        incomplete = []
        if context.recent_commands:
            workflow = await self.suggest_workflow_completion(context.recent_commands)
            if workflow:
                incomplete.append(workflow)

        # Get active file clusters
        active_files = []
        for cluster in context.active_file_clusters[:3]:
            active_files.extend(cluster)

        # Generate high-value suggestions
        suggestions = await self.predict_next_actions(context, max_suggestions=max_suggestions)

        # Time-based context
        timing = await self.suggest_optimal_timing("session_start")
        timing.current_hour = time_of_day

        # Session goal suggestions based on time patterns
        goal_suggestions = []
        if 9 <= time_of_day <= 11:
            goal_suggestions.append("Deep work: High-focus tasks")
        elif 14 <= time_of_day <= 16:
            goal_suggestions.append("Collaboration: Meetings and reviews")
        elif time_of_day >= 17:
            goal_suggestions.append("Planning: Tomorrow's priorities")
        else:
            goal_suggestions.append("Quick wins: Small tasks and clean-up")

        return SessionStartRecommendation(
            incomplete_workflows=incomplete,
            active_file_clusters=list(set(active_files))[:10],
            high_value_suggestions=suggestions[:max_suggestions],
            time_based_context=timing,
            session_goal_suggestions=goal_suggestions
        )

    async def suggest_optimal_timing(
        self,
        activity_type: str
    ) -> TimingSuggestion:
        """Suggest optimal timing for a specific activity type.

        Analyzes historical success rates by time of day for the activity.

        Args:
            activity_type: Type of activity to analyze

        Returns:
            Timing suggestion with optimal hours
        """
        current_hour = datetime.now().hour

        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.row_factory = sqlite3.Row

                # Get success signals by hour for this activity type
                cursor = conn.execute("""
                    SELECT hour, success_count, total_count
                    FROM time_patterns
                    WHERE activity_type = ?
                    ORDER BY success_count DESC
                    LIMIT 24
                """, (activity_type,))

                hourly_data = []
                for row in cursor.fetchall():
                    if row["total_count"] > 0:
                        success_rate = row["success_count"] / row["total_count"]
                        hourly_data.append({
                            "hour": row["hour"],
                            "success_rate": success_rate,
                            "total": row["total_count"]
                        })

                if not hourly_data:
                    # Default timing if no data
                    return TimingSuggestion(
                        activity_type=activity_type,
                        current_hour=current_hour,
                        optimal_hours=[9, 10, 11, 14, 15],
                        current_score=0.7,
                        rationale="Default optimal hours (no historical data yet)",
                        peak_productivity_hours=[9, 10, 11],
                        average_success_rate=0.7
                    )

                # Find optimal hours
                hourly_data.sort(key=lambda x: x["success_rate"], reverse=True)
                optimal_hours = [h["hour"] for h in hourly_data[:5]]
                peak_hours = [h["hour"] for h in hourly_data[:3]]

                # Calculate current time score
                current_score = 0.5  # Default score
                for entry in hourly_data:
                    if entry["hour"] == current_hour:
                        current_score = entry["success_rate"]
                        break

                avg_success = statistics.mean(h["success_rate"] for h in hourly_data)

                return TimingSuggestion(
                    activity_type=activity_type,
                    current_hour=current_hour,
                    optimal_hours=optimal_hours,
                    current_score=current_score,
                    rationale=f"Peak hours: {', '.join(map(str, optimal_hours[:3]))}. Current hour score: {current_score:.1%}",
                    peak_productivity_hours=peak_hours,
                    average_success_rate=avg_success
                )
        except Exception as e:
            print(f"Error suggesting optimal timing: {e}")
            # Fallback
            return TimingSuggestion(
                activity_type=activity_type,
                current_hour=current_hour,
                optimal_hours=[9, 10, 11],
                current_score=0.6,
                rationale="Unable to analyze timing patterns",
                peak_productivity_hours=[9, 10, 11],
                average_success_rate=0.6
            )

    async def build_context(
        self,
        recent_events: List[Dict[str, Any]],
        current_time: datetime
    ) -> PredictionContext:
        """Build prediction context from recent events and time.

        Args:
            recent_events: Recent event data
            current_time: Current time for context

        Returns:
            Prediction context for generating suggestions
        """
        context = PredictionContext(
            time_of_day=current_time.hour,
            day_of_week=current_time.weekday(),
            workspace_root=self.workspace_root
        )

        # Extract recent commands
        for event in recent_events[-20:]:
            if event.get("event_type") == "command_usage":
                cmd = event.get("data", {}).get("command")
                if cmd:
                    context.recent_commands.append(cmd)

        # Extract file clusters
        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.row_factory = sqlite3.Row

                cursor = conn.execute("""
                    SELECT cluster_data, last_updated
                    FROM file_clusters
                    ORDER BY last_updated DESC
                    LIMIT 5
                """)

                for row in cursor.fetchall():
                    cluster_data = json.loads(row["cluster_data"])
                    files = cluster_data.get("files", [])
                    if files:
                        context.active_file_clusters.append(files)
        except Exception:
            pass

        # Store recent activity
        context.recent_activity = recent_events[-10:]

        # Determine session phase
        if len(context.recent_commands) < 5:
            context.session_phase = "start"
        elif len(context.recent_commands) < 20:
            context.session_phase = "middle"
        else:
            context.session_phase = "end"

        return context

    def _calculate_recency_bonus(self, last_seen: str) -> float:
        """Calculate recency bonus for scoring.

        Recent patterns get higher scores. Returns value from 0.0 to 1.0.

        Args:
            last_seen: ISO format timestamp

        Returns:
            Recency bonus value
        """
        try:
            last_seen_dt = datetime.fromisoformat(last_seen)
            days_ago = (datetime.now() - last_seen_dt).days

            # Exponential decay: 1.0 at day 0, ~0.5 at day 7, ~0.1 at day 30
            import math
            return math.exp(-days_ago / 7.0)
        except Exception:
            return 0.0

    def _generate_suggestion_id(self) -> str:
        """Generate unique suggestion ID.

        Returns:
            Unique suggestion identifier
        """
        timestamp = datetime.now().isoformat()
        data = f"{timestamp}_{hash(datetime.now())}".encode()
        return hashlib.md5(data).hexdigest()[:12]

    async def generate_prediction_report(
        self,
        context: PredictionContext
    ) -> PredictionReport:
        """Generate a complete prediction report.

        Args:
            context: Prediction context

        Returns:
            Complete prediction report with all suggestion types
        """
        report = PredictionReport(context=context)

        # Generate all suggestion types
        report.suggestions = await self.predict_next_actions(context)
        report.workflow_prediction = await self.suggest_workflow_completion(context.recent_commands)
        report.timing_suggestion = await self.suggest_optimal_timing("general")

        # Session start recommendations if at session start
        if context.session_phase == "start":
            report.session_start = await self.recommend_session_start(
                context.time_of_day,
                context.day_of_week
            )

        return report
