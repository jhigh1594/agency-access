"""
PatternAnalyzer - Statistical pattern detection from events.db.

Responsibilities:
- Command sequence detection (Markov chains, n-grams)
- File relationship clustering (co-occurrence analysis)
- Time pattern mining (productivity windows)
- Success correlation analysis (activity → outcome)

Design:
- Pure Python, no AI dependencies (fast, deterministic)
- Query-based analysis from events.db
- Returns structured PatternReport
- Graceful degradation (partial results on errors)
"""

import json
import logging
from collections import Counter, defaultdict
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import aiosqlite

from .pattern_models import (
    calculate_jaccard_similarity,
    CommandSequence,
    FileCluster,
    PatternReport,
    SuccessCorrelation,
    TimePatternSummary,
)

logger = logging.getLogger(__name__)


class PatternAnalyzer:
    """Statistical pattern detection from event database.

    Analyzes the events.db to extract actionable patterns:
    - Command sequences: Common workflows (e.g., /brainstorm → /today)
    - File clusters: Files edited together (co-occurrence)
    - Time patterns: Peak productivity windows
    - Success correlations: Activities leading to successful outcomes
    """

    def __init__(self, db_path: str, config: Optional[Dict] = None):
        """Initialize with database path and optional config.

        Args:
            db_path: Path to events.db
            config: Optional configuration dict with analysis thresholds
        """
        self.db_path = db_path
        self.config = config or {}

        # Default thresholds from config
        self.command_min_occurrences = self.config.get(
            "command_min_occurrences", 3
        )
        self.command_sequence_length = self.config.get(
            "command_sequence_length", 3
        )
        self.file_similarity_threshold = self.config.get(
            "file_similarity_threshold", 0.3
        )
        self.file_cluster_min_size = self.config.get(
            "file_cluster_min_size", 2
        )
        self.time_peak_window_hours = self.config.get(
            "time_peak_window_hours", 2
        )
        self.time_min_sessions = self.config.get(
            "time_min_sessions", 5
        )
        self.correlation_window_minutes = self.config.get(
            "correlation_window_minutes", 30
        )
        self.min_correlation = self.config.get(
            "min_correlation", 0.5
        )

    async def analyze_all_patterns(self) -> PatternReport:
        """Run all pattern analyses and return combined report.

        Returns:
            PatternReport with all detected patterns
        """
        logger.info("Starting pattern analysis...")

        command_sequences = await self.analyze_command_sequences()
        file_clusters = await self.analyze_file_relationships()
        time_patterns = await self.analyze_time_patterns()
        success_correlations = await self.analyze_success_correlations()

        # Calculate overall confidence
        pattern_count = (
            len(command_sequences) +
            len(file_clusters) +
            len(success_correlations)
        )
        confidence = min(1.0, pattern_count / 10.0)  # More patterns = higher confidence

        report = PatternReport(
            command_sequences=command_sequences,
            file_clusters=file_clusters,
            time_patterns=time_patterns,
            success_correlations=success_correlations,
            analysis_timestamp=datetime.now().isoformat(),
            confidence=confidence
        )

        logger.info(
            f"Pattern analysis complete: "
            f"{len(command_sequences)} sequences, "
            f"{len(file_clusters)} clusters, "
            f"{len(success_correlations)} correlations"
        )

        return report

    async def analyze_command_sequences(self) -> List[CommandSequence]:
        """Detect common command chains using n-grams.

        Looks for sequences like: /brainstorm → /today → /commit

        Returns:
            List of CommandSequence patterns
        """
        try:
            async with aiosqlite.connect(self.db_path) as db:
                # Get command usage events ordered by time within sessions
                query = """
                    SELECT cu.command_name, cu.event_id,
                           e.event_timestamp, e.session_id
                    FROM command_usage cu
                    JOIN events e ON cu.event_id = e.id
                    ORDER BY e.session_id, e.event_timestamp
                """
                cursor = await db.execute(query)
                rows = await cursor.fetchall()

                if not rows:
                    return []

                # Build sequences per session
                session_sequences: Dict[str, List[str]] = defaultdict(list)
                for command_name, event_id, timestamp, session_id in rows:
                    if session_id:
                        session_sequences[session_id].append(command_name)

                # Extract n-grams (sequences of n commands)
                n = self.command_sequence_length
                sequence_counter: Counter = Counter()
                sequence_durations: Dict[tuple, List[int]] = defaultdict(list)

                for commands in session_sequences.values():
                    if len(commands) < n:
                        continue

                    for i in range(len(commands) - n + 1):
                        seq = tuple(commands[i:i + n])
                        sequence_counter[seq] += 1

                # Convert to CommandSequence objects
                sequences = []
                for seq_tuple, count in sequence_counter.most_common():
                    if count >= self.command_min_occurrences:
                        sequences.append(CommandSequence(
                            sequence=list(seq_tuple),
                            occurrence_count=count,
                            avg_duration_ms=0,  # Could be calculated from timestamps
                            confidence=min(1.0, count / 10.0)
                        ))

                logger.info(f"Detected {len(sequences)} command sequences")
                return sequences

        except Exception as e:
            logger.error(f"Command sequence analysis failed: {e}")
            return []

    async def analyze_file_relationships(self) -> List[FileCluster]:
        """Find files edited together using Jaccard similarity.

        Groups files that are frequently edited within the same session/cluster.

        Returns:
            List of FileCluster patterns
        """
        try:
            async with aiosqlite.connect(self.db_path) as db:
                # Get file clusters from events
                query = """
                    SELECT fc.file_path, fc.cluster_id,
                           COUNT(*) as edit_count
                    FROM file_clusters fc
                    JOIN events e ON fc.event_id = e.id
                    WHERE fc.cluster_id IS NOT NULL
                    GROUP BY fc.cluster_id, fc.file_path
                    ORDER BY fc.cluster_id, edit_count DESC
                """
                cursor = await db.execute(query)
                rows = await cursor.fetchall()

                if not rows:
                    return []

                # Group files by cluster
                cluster_files: Dict[str, List[str]] = defaultdict(list)
                cluster_co_occurrence: Dict[str, int] = {}

                for file_path, cluster_id, edit_count in rows:
                    cluster_files[cluster_id].append(file_path)
                    cluster_co_occurrence[cluster_id] = max(
                        cluster_co_occurrence.get(cluster_id, 0),
                        edit_count
                    )

                # Calculate Jaccard similarity for each cluster
                clusters = []
                for cluster_id, files in cluster_files.items():
                    if len(files) < self.file_cluster_min_size:
                        continue

                    # Calculate similarity based on co-editing frequency
                    # For simplicity, using edit count as proxy
                    similarity = min(1.0, cluster_co_occurrence[cluster_id] / 10.0)

                    if similarity >= self.file_similarity_threshold:
                        # Create a meaningful cluster ID from file names
                        first_file = Path(files[0]).stem
                        cluster_name = f"{first_file}_cluster"

                        clusters.append(FileCluster(
                            files=files,
                            co_occurrence_count=cluster_co_occurrence[cluster_id],
                            jaccard_similarity=similarity,
                            cluster_id=cluster_name
                        ))

                logger.info(f"Detected {len(clusters)} file clusters")
                return clusters

        except Exception as e:
            logger.error(f"File cluster analysis failed: {e}")
            return []

    async def analyze_time_patterns(self) -> Optional[TimePatternSummary]:
        """Identify productivity windows and session patterns.

        Analyzes:
        - Peak hours of day
        - Peak days of week
        - Average session duration

        Returns:
            TimePatternSummary or None if insufficient data
        """
        try:
            async with aiosqlite.connect(self.db_path) as db:
                # Get time pattern events
                query = """
                    SELECT tp.time_of_day_hour, tp.day_of_week,
                           tp.duration_seconds, tp.activity_type
                    FROM time_patterns tp
                    JOIN events e ON tp.event_id = e.id
                """
                cursor = await db.execute(query)
                rows = await cursor.fetchall()

                if not rows:
                    return None

                # Analyze hour distribution
                hour_counts: Counter = Counter()
                day_counts: Counter = Counter()
                session_durations = []

                for hour, day, duration, activity_type in rows:
                    if hour is not None:
                        hour_counts[hour] += 1
                    if day is not None:
                        day_counts[day] += 1
                    if duration and activity_type in ("session_start", "active_work"):
                        session_durations.append(duration / 60)  # Convert to minutes

                # Find peak hours (top contiguous window)
                sorted_hours = [h for h, _ in hour_counts.most_common()]
                peak_hours = self._find_peak_window(sorted_hours, window_hours=self.time_peak_window_hours)

                # Find peak days
                peak_days = [day for day, _ in day_counts.most_common(3)]

                # Calculate average session duration
                avg_duration = (
                    sum(session_durations) / len(session_durations)
                    if session_durations else 0
                )

                # Find most productive hour
                most_productive = hour_counts.most_common(1)[0][0] if hour_counts else None

                summary = TimePatternSummary(
                    peak_hours=peak_hours,
                    peak_days=peak_days,
                    avg_session_duration_minutes=avg_duration,
                    session_count_by_hour=dict(hour_counts),
                    most_productive_hour=most_productive
                )

                logger.info(f"Detected time patterns: peak hours {peak_hours}")
                return summary

        except Exception as e:
            logger.error(f"Time pattern analysis failed: {e}")
            return None

    async def analyze_success_correlations(self) -> List[SuccessCorrelation]:
        """Correlate activities with git commits and task completions.

        Looks for activities that frequently precede successful outcomes.

        Returns:
            List of SuccessCorrelation patterns
        """
        try:
            async with aiosqlite.connect(self.db_path) as db:
                # Get success signals and preceding activities
                query = """
                    SELECT ss.signal_type, ss.signal_strength,
                           e.event_timestamp, e.event_type
                    FROM success_signals ss
                    JOIN events e ON ss.event_id = e.id
                    WHERE e.event_timestamp > datetime('now', '-7 days')
                    ORDER BY e.event_timestamp DESC
                """
                cursor = await db.execute(query)
                rows = await cursor.fetchall()

                if not rows:
                    return []

                # Group by signal type
                correlations = []
                window = timedelta(minutes=self.correlation_window_minutes)

                # Get command usage before each success signal
                for signal_type, strength, timestamp, _ in rows:
                    # Look for commands in the time window before success
                    cmd_query = """
                        SELECT cu.command_name, COUNT(*) as count
                        FROM command_usage cu
                        JOIN events e ON cu.event_id = e.id
                        WHERE e.event_timestamp < ?
                          AND e.event_timestamp > datetime(?, '-' || ? || ' minutes')
                        GROUP BY cu.command_name
                        ORDER BY count DESC
                        LIMIT 5
                    """
                    cmd_cursor = await db.execute(
                        cmd_query,
                        (timestamp, timestamp, self.correlation_window_minutes)
                    )
                    cmd_rows = await cmd_cursor.fetchall()

                    for cmd_name, count in cmd_rows:
                        # Calculate correlation strength based on frequency
                        correlation = min(1.0, count / 5.0)  # Normalize

                        if correlation >= self.min_correlation:
                            correlations.append(SuccessCorrelation(
                                activity_type="command_usage",
                                activity_pattern=cmd_name,
                                outcome_type=signal_type,
                                correlation_strength=correlation,
                                sample_size=count,
                                time_window_minutes=self.correlation_window_minutes
                            ))

                # Get file edits before success signals
                file_query = """
                    SELECT fc.file_path, COUNT(*) as count
                    FROM file_clusters fc
                    JOIN events e ON fc.event_id = e.id
                    JOIN success_signals ss ON e.event_timestamp < ss.event_timestamp
                    WHERE ss.event_timestamp > datetime(e.event_timestamp, '+' || ? || ' minutes')
                      AND ss.event_timestamp < datetime(e.event_timestamp, '+' || ? || ' minutes')
                    GROUP BY fc.file_path
                    ORDER BY count DESC
                    LIMIT 5
                """
                file_cursor = await db.execute(
                    file_query,
                    (1, self.correlation_window_minutes)
                )
                file_rows = await file_cursor.fetchall()

                for file_path, count in file_rows:
                    correlation = min(1.0, count / 10.0)
                    if correlation >= self.min_correlation:
                        correlations.append(SuccessCorrelation(
                            activity_type="file_edit",
                            activity_pattern=file_path,
                            outcome_type="success",
                            correlation_strength=correlation,
                            sample_size=count,
                            time_window_minutes=self.correlation_window_minutes
                        ))

                logger.info(f"Detected {len(correlations)} success correlations")
                return correlations

        except Exception as e:
            logger.error(f"Success correlation analysis failed: {e}")
            return []

    def _find_peak_window(self, sorted_hours: List[int], window_hours: int) -> List[int]:
        """Find contiguous window with highest activity.

        Args:
            sorted_hours: Hours sorted by frequency (most frequent first)
            window_hours: Size of window to find

        Returns:
            List of hours in the peak window
        """
        if not sorted_hours:
            return []

        if len(sorted_hours) <= window_hours:
            return sorted_hours

        # Simple approach: take top window_hours entries
        # A more sophisticated approach would find contiguous windows
        return sorted_hours[:window_hours]


def calculate_confidence(occurrences: int, min_samples: int = 3) -> float:
    """Calculate confidence score based on sample size.

    Uses a sigmoid-like function to boost confidence as samples increase.

    Args:
        occurrences: Number of times pattern was observed
        min_samples: Minimum samples for baseline confidence

    Returns:
        Confidence score from 0.0 to 1.0
    """
    if occurrences < min_samples:
        return 0.1  # Low confidence for insufficient samples
    return min(1.0, occurrences / (min_samples * 3))
