"""
PatternStore - Long-term pattern storage and retrieval.

Separate from events.db - patterns persist beyond 7-day TTL.
"""

import json
import logging
from datetime import datetime, timedelta, date
from pathlib import Path
from typing import Any, Dict, List, Optional

import aiosqlite

from .pattern_models import (
    CommandSequence,
    FileCluster,
    PatternHistory,
    PatternReport,
    SuccessCorrelation,
)

# Phase 4: Executive Intelligence imports
from .executive_models import (
    WeeklySnapshot,
    TrendMetric,
    ExecutiveAlert,
    GoalCorrelation,
    AlertSeverity,
    TrendDirection,
    TrendSignificance,
    ProgressIndicator,
)

logger = logging.getLogger(__name__)


class PatternStore:
    """Long-term pattern storage and retrieval.

    Manages patterns.db which stores detected patterns for
    historical analysis and trend tracking.

    Unlike events.db (7-day TTL), patterns.db has 90+ day retention.
    """

    # Default schema SQL
    SCHEMA_SQL = """
    -- Pattern history with aggregation
    CREATE TABLE IF NOT EXISTS pattern_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pattern_type TEXT NOT NULL,
        pattern_key TEXT NOT NULL,
        pattern_data TEXT NOT NULL,
        confidence REAL DEFAULT 0.5,
        first_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
        occurrence_count INTEGER DEFAULT 1
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_pattern_key ON pattern_history(pattern_key);
    CREATE INDEX IF NOT EXISTS idx_pattern_type ON pattern_history(pattern_type);
    CREATE INDEX IF NOT EXISTS idx_pattern_last_seen ON pattern_history(last_seen);

    -- Insight history
    CREATE TABLE IF NOT EXISTS insight_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        insight_type TEXT NOT NULL,
        insight_data TEXT NOT NULL,
        generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        shown_to_user BOOLEAN DEFAULT TRUE
    );

    CREATE INDEX IF NOT EXISTS idx_insight_type ON insight_history(insight_type);
    CREATE INDEX IF NOT EXISTS idx_insight_generated ON insight_history(generated_at);

    -- Pattern aggregations (weekly/monthly summaries)
    CREATE TABLE IF NOT EXISTS pattern_aggregations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        aggregation_type TEXT NOT NULL,
        period_start DATETIME NOT NULL,
        period_end DATETIME NOT NULL,
        aggregation_data TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_agg_period ON pattern_aggregations(period_start, period_end);
    """

    # Phase 4: Executive Intelligence schema
    EXECUTIVE_SCHEMA_SQL = """
    -- Weekly snapshots for trend analysis
    CREATE TABLE IF NOT EXISTS weekly_snapshots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        period_start DATE NOT NULL,
        period_end DATE NOT NULL,
        productivity_score REAL,
        total_events INTEGER,
        strategic_alignment_avg REAL,
        top_patterns TEXT,
        anomalies_count INTEGER DEFAULT 0,
        pattern_diversity REAL DEFAULT 0.0,
        success_signal_rate REAL DEFAULT 0.0,
        active_hours INTEGER DEFAULT 0,
        snapshot_metadata TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(period_start, period_end)
    );

    CREATE INDEX IF NOT EXISTS idx_snapshot_period ON weekly_snapshots(period_start, period_end);
    CREATE INDEX IF NOT EXISTS idx_snapshot_created ON weekly_snapshots(created_at);

    -- Trend metrics storage
    CREATE TABLE IF NOT EXISTS trend_metrics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        metric_name TEXT NOT NULL,
        date DATE NOT NULL,
        value REAL NOT NULL,
        change_percent REAL,
        trend_direction TEXT,
        significance TEXT,
        z_score REAL DEFAULT 0.0,
        data_points INTEGER DEFAULT 1,
        UNIQUE(metric_name, date)
    );

    CREATE INDEX IF NOT EXISTS idx_trend_metric_date ON trend_metrics(metric_name, date);
    CREATE INDEX IF NOT EXISTS idx_trend_created ON trend_metrics(date);

    -- Executive alerts
    CREATE TABLE IF NOT EXISTS executive_alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        alert_id TEXT NOT NULL UNIQUE,
        severity TEXT NOT NULL,
        category TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        data_evidence TEXT,
        suggested_actions TEXT,
        threshold_triggered REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        acknowledged BOOLEAN DEFAULT FALSE
    );

    CREATE INDEX IF NOT EXISTS idx_alert_severity ON executive_alerts(severity, created_at);
    CREATE INDEX IF NOT EXISTS idx_alert_category ON executive_alerts(category, created_at);
    CREATE INDEX IF NOT EXISTS idx_alert_acknowledged ON executive_alerts(acknowledged);

    -- Goal progress tracking
    CREATE TABLE IF NOT EXISTS goal_progress (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        okr_id TEXT NOT NULL,
        okr_title TEXT,
        period_start DATE,
        period_end DATE,
        aligned_patterns TEXT,
        alignment_score REAL,
        progress_indicator TEXT,
        recommendations TEXT,
        evidence_count INTEGER DEFAULT 0,
        last_activity DATETIME,
        last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(okr_id, period_start)
    );

    CREATE INDEX IF NOT EXISTS idx_goal_okr ON goal_progress(okr_id, period_start);
    CREATE INDEX IF NOT EXISTS idx_goal_updated ON goal_progress(last_updated);
    """

    def __init__(self, workspace_root: Path, db_path: Optional[str] = None):
        """Initialize with workspace path.

        Args:
            workspace_root: Path to workspace root
            db_path: Optional custom path to patterns.db
        """
        self.workspace_root = workspace_root
        self.db_path = db_path or str(workspace_root / ".aipmos" / "patterns.db")
        self._initialized = False

    async def initialize(self) -> None:
        """Initialize database with schema if needed."""
        if self._initialized:
            return

        db_file = Path(self.db_path)
        db_file.parent.mkdir(parents=True, exist_ok=True)

        # Check if database already exists
        if db_file.exists():
            # Still need to check for executive tables (migration)
            await self._ensure_executive_tables()
            self._initialized = True
            return

        # Initialize schema
        async with aiosqlite.connect(self.db_path) as db:
            await db.executescript(self.SCHEMA_SQL)
            await db.executescript(self.EXECUTIVE_SCHEMA_SQL)
            await db.commit()

        logger.info(f"Initialized pattern database at {self.db_path}")
        self._initialized = True

    async def _ensure_executive_tables(self) -> None:
        """Ensure executive intelligence tables exist (migration support).

        Checks for existing tables and adds Phase 4 tables if missing.
        This allows graceful migration from pre-Phase 4 databases.
        """
        try:
            async with aiosqlite.connect(self.db_path) as db:
                # Check if weekly_snapshots table exists
                cursor = await db.execute("""
                    SELECT name FROM sqlite_master
                    WHERE type='table' AND name='weekly_snapshots'
                """)
                if await cursor.fetchone():
                    # Executive tables already exist
                    return

                # Need to create executive tables (migration)
                logger.info("Migrating database: adding executive intelligence tables")
                await db.executescript(self.EXECUTIVE_SCHEMA_SQL)
                await db.commit()
                logger.info("Executive intelligence tables added successfully")

        except Exception as e:
            logger.error(f"Failed to ensure executive tables: {e}")

    async def store_patterns(self, pattern_report: PatternReport) -> bool:
        """Store or update patterns in patterns.db.

        Args:
            pattern_report: PatternReport with detected patterns

        Returns:
            True if successful
        """
        await self.initialize()

        try:
            async with aiosqlite.connect(self.db_path) as db:
                # Store command sequences
                for seq in pattern_report.command_sequences:
                    await self._upsert_pattern(
                        db,
                        pattern_type="command_sequence",
                        pattern_key="→".join(seq.sequence),
                        pattern_data={
                            "sequence": seq.sequence,
                            "occurrence_count": seq.occurrence_count,
                            "confidence": seq.confidence
                        },
                        confidence=seq.confidence
                    )

                # Store file clusters
                for cluster in pattern_report.file_clusters:
                    await self._upsert_pattern(
                        db,
                        pattern_type="file_cluster",
                        pattern_key=cluster.cluster_id,
                        pattern_data={
                            "cluster_id": cluster.cluster_id,
                            "files": cluster.files,
                            "similarity": cluster.jaccard_similarity,
                            "count": cluster.co_occurrence_count
                        },
                        confidence=cluster.jaccard_similarity
                    )

                # Store success correlations
                for corr in pattern_report.success_correlations:
                    key = f"{corr.activity_pattern}→{corr.outcome_type}"
                    await self._upsert_pattern(
                        db,
                        pattern_type="success_correlation",
                        pattern_key=key,
                        pattern_data={
                            "activity": corr.activity_pattern,
                            "outcome": corr.outcome_type,
                            "strength": corr.correlation_strength,
                            "sample_size": corr.sample_size
                        },
                        confidence=corr.correlation_strength
                    )

                await db.commit()

            logger.info(
                f"Stored {pattern_report.pattern_count} patterns in pattern store"
            )
            return True

        except Exception as e:
            logger.error(f"Failed to store patterns: {e}")
            return False

    async def _upsert_pattern(
        self,
        db: aiosqlite.Connection,
        pattern_type: str,
        pattern_key: str,
        pattern_data: Dict[str, Any],
        confidence: float
    ) -> None:
        """Insert or update a pattern record.

        Args:
            db: Database connection
            pattern_type: Type of pattern
            pattern_key: Unique key for pattern
            pattern_data: Pattern data (will be JSON-serialized)
            confidence: Pattern confidence score
        """
        data_json = json.dumps(pattern_data)

        # Try to update existing
        cursor = await db.execute(
            """
            UPDATE pattern_history
            SET pattern_data = ?,
                confidence = ?,
                last_seen = CURRENT_TIMESTAMP,
                occurrence_count = occurrence_count + 1
            WHERE pattern_key = ?
            """,
            (data_json, confidence, pattern_key)
        )

        if cursor.rowcount == 0:
            # Insert new
            await db.execute(
                """
                INSERT INTO pattern_history
                (pattern_type, pattern_key, pattern_data, confidence, occurrence_count)
                VALUES (?, ?, ?, ?, 1)
                """,
                (pattern_type, pattern_key, data_json, confidence)
            )

    async def get_recent_patterns(self, days: int = 7) -> List[Dict[str, Any]]:
        """Get patterns from last N days.

        Args:
            days: Number of days to look back

        Returns:
            List of pattern dictionaries
        """
        await self.initialize()

        try:
            async with aiosqlite.connect(self.db_path) as db:
                cursor = await db.execute(
                    """
                    SELECT pattern_type, pattern_key, pattern_data, confidence, last_seen
                    FROM pattern_history
                    WHERE last_seen > datetime('now', '-' || ? || ' days')
                    ORDER BY last_seen DESC
                    LIMIT 50
                    """,
                    (days,)
                )
                rows = await cursor.fetchall()

                patterns = []
                for row in rows:
                    patterns.append({
                        "type": row[0],
                        "key": row[1],
                        "data": json.loads(row[2]),
                        "confidence": row[3],
                        "last_seen": row[4]
                    })

                return patterns

        except Exception as e:
            logger.error(f"Failed to get recent patterns: {e}")
            return []

    async def get_pattern_history(
        self,
        pattern_type: Optional[str] = None,
        limit: int = 100
    ) -> List[PatternHistory]:
        """Get pattern history for trend analysis.

        Args:
            pattern_type: Filter by pattern type (optional)
            limit: Maximum records to return

        Returns:
            List of PatternHistory records
        """
        await self.initialize()

        try:
            async with aiosqlite.connect(self.db_path) as db:
                if pattern_type:
                    cursor = await db.execute(
                        """
                        SELECT pattern_type, pattern_key, pattern_data, confidence,
                               first_seen, last_seen, occurrence_count
                        FROM pattern_history
                        WHERE pattern_type = ?
                        ORDER BY last_seen DESC
                        LIMIT ?
                        """,
                        (pattern_type, limit)
                    )
                else:
                    cursor = await db.execute(
                        """
                        SELECT pattern_type, pattern_key, pattern_data, confidence,
                               first_seen, last_seen, occurrence_count
                        FROM pattern_history
                        ORDER BY last_seen DESC
                        LIMIT ?
                        """,
                        (limit,)
                    )

                rows = await cursor.fetchall()

                return [PatternHistory.from_row(row) for row in rows]

        except Exception as e:
            logger.error(f"Failed to get pattern history: {e}")
            return []

    async def cleanup_old_patterns(self, retention_days: int = 90) -> int:
        """Remove patterns older than retention period.

        Args:
            retention_days: Days to retain patterns

        Returns:
            Number of patterns removed
        """
        await self.initialize()

        try:
            async with aiosqlite.connect(self.db_path) as db:
                cursor = await db.execute(
                    """
                    DELETE FROM pattern_history
                    WHERE last_seen < datetime('now', '-' || ? || ' days')
                    """,
                    (retention_days,)
                )

                deleted = cursor.rowcount
                await db.commit()

                logger.info(f"Cleaned up {deleted} old patterns")
                return deleted

        except Exception as e:
            logger.error(f"Failed to cleanup patterns: {e}")
            return 0

    async def get_trending_patterns(self, days: int = 7) -> Dict[str, List[Dict]]:
        """Get patterns that are trending (increasing frequency).

        Args:
            days: Lookback period for trend analysis

        Returns:
            Dictionary with pattern types as keys and trending patterns
        """
        await self.initialize()

        try:
            async with aiosqlite.connect(self.db_path) as db:
                # Get patterns with high occurrence count recently
                cursor = await db.execute(
                    """
                    SELECT pattern_type, pattern_key, pattern_data, occurrence_count
                    FROM pattern_history
                    WHERE last_seen > datetime('now', '-' || ? || ' days')
                    ORDER BY occurrence_count DESC
                    LIMIT 20
                    """,
                    (days,)
                )
                rows = await cursor.fetchall()

                trending: Dict[str, List[Dict]] = {
                    "command_sequence": [],
                    "file_cluster": [],
                    "success_correlation": []
                }

                for row in rows:
                    pattern_type, key, data, count = row
                    if pattern_type in trending:
                        trending[pattern_type].append({
                            "key": key,
                            "data": json.loads(data),
                            "count": count
                        })

                return trending

        except Exception as e:
            logger.error(f"Failed to get trending patterns: {e}")
            return {}

    async def store_insight(
        self,
        insight_type: str,
        insight_data: Dict[str, Any]
    ) -> bool:
        """Store generated insight in history.

        Args:
            insight_type: Type of insight
            insight_data: Insight content

        Returns:
            True if successful
        """
        await self.initialize()

        try:
            async with aiosqlite.connect(self.db_path) as db:
                await db.execute(
                    """
                    INSERT INTO insight_history (insight_type, insight_data)
                    VALUES (?, ?)
                    """,
                    (insight_type, json.dumps(insight_data))
                )
                await db.commit()

            return True

        except Exception as e:
            logger.error(f"Failed to store insight: {e}")
            return False

    async def get_stats(self) -> Dict[str, int]:
        """Get database statistics.

        Returns:
            Dictionary with pattern counts
        """
        await self.initialize()

        try:
            async with aiosqlite.connect(self.db_path) as db:
                stats = {}

                # Total patterns
                cursor = await db.execute(
                    "SELECT COUNT(*) FROM pattern_history"
                )
                stats["total_patterns"] = (await cursor.fetchone())[0]

                # Patterns by type
                cursor = await db.execute(
                    """
                    SELECT pattern_type, COUNT(*)
                    FROM pattern_history
                    GROUP BY pattern_type
                    """
                )
                for row in await cursor.fetchall():
                    stats[f"{row[0]}_count"] = row[1]

                # Recent insights
                cursor = await db.execute(
                    """
                    SELECT COUNT(*) FROM insight_history
                    WHERE generated_at > datetime('now', '-7 days')
                    """
                )
                stats["recent_insights"] = (await cursor.fetchone())[0]

                return stats

        except Exception as e:
            logger.error(f"Failed to get stats: {e}")
            return {}

    # =========================================================================
    # Phase 4: Executive Intelligence - Weekly Snapshot Storage
    # =========================================================================

    async def store_weekly_snapshot(self, snapshot: WeeklySnapshot) -> bool:
        """Store a weekly snapshot for trend analysis.

        Args:
            snapshot: WeeklySnapshot to store

        Returns:
            True if successful
        """
        await self.initialize()

        try:
            async with aiosqlite.connect(self.db_path) as db:
                await db.execute(
                    """
                    INSERT OR REPLACE INTO weekly_snapshots
                    (period_start, period_end, productivity_score, total_events,
                     strategic_alignment_avg, top_patterns, anomalies_count,
                     pattern_diversity, success_signal_rate, active_hours, snapshot_metadata)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        snapshot.period_start.isoformat(),
                        snapshot.period_end.isoformat(),
                        snapshot.productivity_score,
                        snapshot.total_events,
                        snapshot.strategic_alignment_avg,
                        json.dumps(snapshot.top_patterns),
                        snapshot.anomalies_detected,
                        snapshot.pattern_diversity,
                        snapshot.success_signal_rate,
                        snapshot.active_hours,
                        json.dumps(snapshot.to_dict())
                    )
                )
                await db.commit()

            logger.info(f"Stored weekly snapshot for {snapshot.period_start}")
            return True

        except Exception as e:
            logger.error(f"Failed to store weekly snapshot: {e}")
            return False

    async def get_recent_snapshots(self, weeks: int = 4) -> List[WeeklySnapshot]:
        """Get recent weekly snapshots for trend analysis.

        Args:
            weeks: Number of weeks to look back

        Returns:
            List of WeeklySnapshot objects
        """
        await self.initialize()

        try:
            async with aiosqlite.connect(self.db_path) as db:
                cursor = await db.execute(
                    """
                    SELECT period_start, period_end, productivity_score, total_events,
                           strategic_alignment_avg, top_patterns, anomalies_count,
                           pattern_diversity, success_signal_rate, active_hours
                    FROM weekly_snapshots
                    ORDER BY period_start DESC
                    LIMIT ?
                    """,
                    (weeks,)
                )

                rows = await cursor.fetchall()
                snapshots = []

                for row in rows:
                    snapshots.append(WeeklySnapshot(
                        period_start=date.fromisoformat(row[0]),
                        period_end=date.fromisoformat(row[1]),
                        productivity_score=row[2],
                        total_events=row[3],
                        strategic_alignment_avg=row[4],
                        top_patterns=json.loads(row[5]) if row[5] else [],
                        anomalies_detected=row[6],
                        pattern_diversity=row[7] if row[7] else 0.0,
                        success_signal_rate=row[8] if row[8] else 0.0,
                        active_hours=row[9] if row[9] else 0
                    ))

                return snapshots

        except Exception as e:
            logger.error(f"Failed to get weekly snapshots: {e}")
            return []

    async def store_trend_metric(self, metric: TrendMetric) -> bool:
        """Store a trend metric for historical tracking.

        Args:
            metric: TrendMetric to store

        Returns:
            True if successful
        """
        await self.initialize()

        try:
            async with aiosqlite.connect(self.db_path) as db:
                await db.execute(
                    """
                    INSERT OR REPLACE INTO trend_metrics
                    (metric_name, date, value, change_percent, trend_direction,
                     significance, z_score, data_points)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        metric.metric_name,
                        datetime.now().date().isoformat(),
                        metric.current_value,
                        metric.change_percent,
                        metric.trend_direction.value,
                        metric.significance.value,
                        metric.z_score,
                        metric.data_points
                    )
                )
                await db.commit()

            return True

        except Exception as e:
            logger.error(f"Failed to store trend metric: {e}")
            return False

    async def store_executive_alert(self, alert: ExecutiveAlert) -> bool:
        """Store an executive alert.

        Args:
            alert: ExecutiveAlert to store

        Returns:
            True if successful
        """
        await self.initialize()

        try:
            async with aiosqlite.connect(self.db_path) as db:
                await db.execute(
                    """
                    INSERT OR REPLACE INTO executive_alerts
                    (alert_id, severity, category, title, description,
                     data_evidence, suggested_actions, threshold_triggered, acknowledged)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        alert.alert_id,
                        alert.severity.value,
                        alert.category.value,
                        alert.title,
                        alert.description,
                        json.dumps(alert.data_evidence),
                        json.dumps(alert.suggested_actions),
                        alert.threshold_triggered,
                        alert.acknowledged
                    )
                )
                await db.commit()

            return True

        except Exception as e:
            logger.error(f"Failed to store executive alert: {e}")
            return False

    async def get_active_alerts(
        self,
        severity: Optional[AlertSeverity] = None,
        limit: int = 10
    ) -> List[ExecutiveAlert]:
        """Get unacknowledged executive alerts.

        Args:
            severity: Filter by severity (optional)
            limit: Maximum alerts to return

        Returns:
            List of ExecutiveAlert objects
        """
        await self.initialize()

        try:
            async with aiosqlite.connect(self.db_path) as db:
                if severity:
                    cursor = await db.execute(
                        """
                        SELECT alert_id, severity, category, title, description,
                               data_evidence, suggested_actions, threshold_triggered,
                               created_at, acknowledged
                        FROM executive_alerts
                        WHERE acknowledged = FALSE AND severity = ?
                        ORDER BY created_at DESC
                        LIMIT ?
                        """,
                        (severity.value, limit)
                    )
                else:
                    cursor = await db.execute(
                        """
                        SELECT alert_id, severity, category, title, description,
                               data_evidence, suggested_actions, threshold_triggered,
                               created_at, acknowledged
                        FROM executive_alerts
                        WHERE acknowledged = FALSE
                        ORDER BY created_at DESC
                        LIMIT ?
                        """,
                        (limit,)
                    )

                rows = await cursor.fetchall()
                alerts = []

                for row in rows:
                    alerts.append(ExecutiveAlert(
                        alert_id=row[0],
                        severity=AlertSeverity(row[1]),
                        category=AlertCategory(row[2]),
                        title=row[3],
                        description=row[4],
                        data_evidence=json.loads(row[5]) if row[5] else {},
                        suggested_actions=json.loads(row[6]) if row[6] else [],
                        created_at=datetime.fromisoformat(row[7]),
                        threshold_triggered=row[8],
                        acknowledged=row[9]
                    ))

                return alerts

        except Exception as e:
            logger.error(f"Failed to get active alerts: {e}")
            return []

    async def store_goal_correlation(self, correlation: GoalCorrelation) -> bool:
        """Store a goal correlation for OKR tracking.

        Args:
            correlation: GoalCorrelation to store

        Returns:
            True if successful
        """
        await self.initialize()

        try:
            async with aiosqlite.connect(self.db_path) as db:
                period_start = datetime.now().date().replace(day=1)  # First of month
                await db.execute(
                    """
                    INSERT OR REPLACE INTO goal_progress
                    (okr_id, okr_title, period_start, aligned_patterns,
                     alignment_score, progress_indicator, recommendations,
                     evidence_count, last_activity, last_updated)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                    """,
                    (
                        correlation.okr_id,
                        correlation.okr_title,
                        period_start.isoformat(),
                        json.dumps(correlation.aligned_patterns),
                        correlation.alignment_score,
                        correlation.progress_indicator.value,
                        json.dumps(correlation.recommendations),
                        correlation.evidence_count,
                        correlation.last_activity.isoformat() if correlation.last_activity else None
                    )
                )
                await db.commit()

            return True

        except Exception as e:
            logger.error(f"Failed to store goal correlation: {e}")
            return False

    async def get_goal_correlations(self, period_start: Optional[date] = None) -> List[GoalCorrelation]:
        """Get goal correlations for tracking strategic alignment.

        Args:
            period_start: Filter by period (optional)

        Returns:
            List of GoalCorrelation objects
        """
        await self.initialize()

        try:
            async with aiosqlite.connect(self.db_path) as db:
                if period_start:
                    cursor = await db.execute(
                        """
                        SELECT okr_id, okr_title, aligned_patterns, alignment_score,
                               progress_indicator, recommendations, evidence_count, last_activity
                        FROM goal_progress
                        WHERE period_start = ?
                        ORDER BY alignment_score DESC
                        """,
                        (period_start.isoformat(),)
                    )
                else:
                    cursor = await db.execute(
                        """
                        SELECT okr_id, okr_title, aligned_patterns, alignment_score,
                               progress_indicator, recommendations, evidence_count, last_activity
                        FROM goal_progress
                        ORDER BY last_updated DESC
                        """
                    )

                rows = await cursor.fetchall()
                correlations = []

                for row in rows:
                    correlations.append(GoalCorrelation(
                        okr_id=row[0],
                        okr_title=row[1],
                        aligned_patterns=json.loads(row[2]) if row[2] else [],
                        alignment_score=row[3],
                        progress_indicator=ProgressIndicator(row[4]),
                        recommendations=json.loads(row[5]) if row[5] else [],
                        evidence_count=row[6] if row[6] else 0,
                        last_activity=datetime.fromisoformat(row[7]) if row[7] else None
                    ))

                return correlations

        except Exception as e:
            logger.error(f"Failed to get goal correlations: {e}")
            return []

    async def cleanup_old_snapshots(self, retention_weeks: int = 12) -> int:
        """Remove snapshots older than retention period.

        Args:
            retention_weeks: Number of weeks to retain

        Returns:
            Number of snapshots removed
        """
        await self.initialize()

        try:
            async with aiosqlite.connect(self.db_path) as db:
                cursor = await db.execute(
                    """
                    DELETE FROM weekly_snapshots
                    WHERE period_start < date('now', '-' || ? || ' weeks')
                    """,
                    (retention_weeks,)
                )

                deleted = cursor.rowcount
                await db.commit()

                logger.info(f"Cleaned up {deleted} old weekly snapshots")
                return deleted

        except Exception as e:
            logger.error(f"Failed to cleanup snapshots: {e}")
            return 0

    async def cleanup_old_alerts(self, retention_days: int = 90) -> int:
        """Remove old acknowledged alerts.

        Args:
            retention_days: Days to retain acknowledged alerts

        Returns:
            Number of alerts removed
        """
        await self.initialize()

        try:
            async with aiosqlite.connect(self.db_path) as db:
                cursor = await db.execute(
                    """
                    DELETE FROM executive_alerts
                    WHERE acknowledged = TRUE
                      AND created_at < datetime('now', '-' || ? || ' days')
                    """,
                    (retention_days,)
                )

                deleted = cursor.rowcount
                await db.commit()

                logger.info(f"Cleaned up {deleted} old alerts")
                return deleted

        except Exception as e:
            logger.error(f"Failed to cleanup alerts: {e}")
            return 0
