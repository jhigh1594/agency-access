"""
EventOrchestrator - Coordinates passive event capture from all observers.

Follows BaseOrchestrator pattern:
Collection → Analysis → Synthesis → Delivery → Storage
"""

import json
import logging
from typing import Dict, Any, Optional
from pathlib import Path
import aiosqlite

from shared.base_orchestrator import BaseOrchestrator
from .command_usage_observer import CommandUsageObserver
from .file_clusters_observer import FileClustersObserver
from .time_patterns_observer import TimePatternsObserver
from .success_signals_observer import SuccessSignalsObserver

logger = logging.getLogger(__name__)


class EventOrchestrator(BaseOrchestrator):
    """Orchestrates passive event capture from all observers.

    Phase 1 focuses on passive collection with local storage.
    Phase 2 will add analysis and pattern extraction.
    """

    def __init__(self, config_path: str = ".aipmos/aipmos.yaml", workspace_root: Optional[Path] = None):
        super().__init__(config_path)
        self.observers: Dict[str, Any] = {}
        self.session_id: Optional[str] = None
        self._workspace_root = workspace_root or Path.cwd()

    async def _collect_data(self) -> Dict[str, Any]:
        """Initialize all observers and database.

        This is the Collection phase - sets up the capture infrastructure.
        """
        # Get session ID from config
        self.session_id = self.config.get("session_tracking", {}).get("current_session_id")

        # Initialize database
        db_path = self._get_db_path()
        await self._init_database(db_path)

        # Get observer configuration
        observers_config = self.config.get("events_db", {}).get("observers", {})

        # Initialize enabled observers
        self.observers = {}

        if observers_config.get("command_usage", {}).get("enabled", True):
            self.observers["command_usage"] = CommandUsageObserver(db_path, self.session_id)

        if observers_config.get("file_clusters", {}).get("enabled", True):
            cluster_timeout = observers_config.get("file_clusters", {}).get("cluster_timeout_seconds", 300)
            self.observers["file_clusters"] = FileClustersObserver(db_path, self.session_id, cluster_timeout)

        if observers_config.get("time_patterns", {}).get("enabled", True):
            self.observers["time_patterns"] = TimePatternsObserver(db_path, self.session_id)

        if observers_config.get("success_signals", {}).get("enabled", True):
            signal_weights = observers_config.get("success_signals", {}).get("signal_weights", {})
            self.observers["success_signals"] = SuccessSignalsObserver(db_path, self.session_id, signal_weights)

        logger.info(f"Initialized {len(self.observers)} observers")

        return {"status": "ready", "observers_initialized": len(self.observers)}

    async def _analyze_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Analysis phase - Phase 2: Pattern extraction and learning."""
        try:
            from .pattern_analyzer import PatternAnalyzer

            pattern_config = self.config.get("pattern_analysis", {})
            if not pattern_config.get("enabled", True):
                logger.debug("Pattern analysis disabled, skipping")
                return data

            analyzer = PatternAnalyzer(
                self._get_db_path(),
                config=pattern_config
            )
            pattern_report = await analyzer.analyze_all_patterns()

            logger.info(
                f"Pattern analysis complete: "
                f"{len(pattern_report.command_sequences)} sequences, "
                f"{len(pattern_report.file_clusters)} clusters, "
                f"{len(pattern_report.success_correlations)} correlations"
            )

            return {
                "status": "analyzed",
                "pattern_report": pattern_report,
                "raw": data
            }

        except Exception as e:
            logger.error(f"Pattern analysis failed: {e}")
            return {"status": "analysis_failed", "raw_data": data}

    async def _predict_suggestions(self, analyzed: Dict[str, Any]) -> Dict[str, Any]:
        """Prediction phase - Phase 3: Generate predictions from patterns."""
        try:
            pattern_report = analyzed.get("pattern_report")
            if not pattern_report:
                logger.debug("No pattern report available, skipping predictions")
                return {}

            prediction_config = self.config.get("prediction", {})
            if not prediction_config.get("enabled", True):
                logger.debug("Predictions disabled, skipping")
                return {}

            from .predictor import PatternPredictor, PredictionContext
            from datetime import datetime

            predictor = PatternPredictor(self._get_db_path(), str(self._workspace_root))

            # Build context from recent events
            recent_events = await self._get_recent_events(limit=20)
            context = await predictor.build_context(
                recent_events=recent_events,
                current_time=datetime.now()
            )

            # Generate predictions
            suggestions = await predictor.predict_next_actions(
                context=context,
                max_suggestions=prediction_config.get("max_suggestions", 5),
                min_confidence=prediction_config.get("min_confidence", 0.4)
            )

            workflow = await predictor.suggest_workflow_completion(context.recent_commands)

            # Generate timing suggestion
            timing = None
            if prediction_config.get("timing_suggestions_enabled", True):
                timing = await predictor.suggest_optimal_timing("general")

            # Generate session start recommendations if applicable
            session_start = None
            if context.session_phase == "start" and prediction_config.get("session_start_enabled", True):
                session_start = await predictor.recommend_session_start(
                    context.time_of_day,
                    context.day_of_week,
                    max_suggestions=prediction_config.get("max_session_suggestions", 7)
                )

            logger.info(
                f"Predictions generated: {len(suggestions)} suggestions, "
                f"workflow: {workflow.workflow_name if workflow else None}, "
                f"timing score: {timing.current_score if timing else 0:.0%}"
            )

            return {
                "suggestions": suggestions,
                "workflow": workflow,
                "timing": timing,
                "session_start": session_start,
                "context": context
            }

        except Exception as e:
            logger.error(f"Prediction generation failed: {e}")
            return {}

    async def _get_recent_events(self, limit: int = 20) -> List[Dict[str, Any]]:
        """Get recent events from database for context building.

        Args:
            limit: Maximum number of events to return

        Returns:
            List of event dictionaries
        """
        events = []
        try:
            db_path = self._get_db_path()
            async with aiosqlite.connect(db_path) as db:
                cursor = await db.execute("""
                    SELECT event_type, event_timestamp, data, session_id
                    FROM events
                    ORDER BY event_timestamp DESC
                    LIMIT ?
                """, (limit,))

                rows = await cursor.fetchall()
                for row in rows:
                    events.append({
                        "event_type": row[0],
                        "timestamp": row[1],
                        "data": json.loads(row[2]) if row[2] else {},
                        "session_id": row[3]
                    })
        except Exception as e:
            logger.error(f"Failed to get recent events: {e}")

        return events

    async def _synthesize_output(self, analyzed: Dict[str, Any]) -> Dict[str, Any]:
        """Synthesis phase - Generate insights from patterns and predictions."""
        try:
            pattern_report = analyzed.get("pattern_report")
            predictions = analyzed.get("predictions", {})

            if not pattern_report:
                # Fallback to basic statistics
                stats = await self._get_event_statistics()
                return {"summary_type": "event_statistics", "statistics": stats}

            from .insight_generator import InsightGenerator

            generator = InsightGenerator(self._workspace_root)
            insights = await generator.generate_insights(pattern_report)

            result = {
                "summary_type": "pattern_insights",
                "patterns": pattern_report,
                "insights": insights,
                "predictions": predictions
            }

            # Add session start recommendations if available
            if predictions.get("session_start"):
                result["session_start"] = predictions["session_start"]

            # Phase 4: Generate executive intelligence
            executive_config = self.config.get("executive_intelligence", {})
            if executive_config.get("enabled", False):
                executive_report = await generator.generate_executive_insights(
                    pattern_report=pattern_report,
                    enable_executive=True,
                    prediction_report=predictions
                )
                if executive_report:
                    result["executive_report"] = executive_report

            return result

        except Exception as e:
            logger.error(f"Insight generation failed: {e}")
            # Fallback to patterns only
            if analyzed.get("pattern_report"):
                return {
                    "summary_type": "patterns_only",
                    "patterns": analyzed.get("pattern_report"),
                    "predictions": analyzed.get("predictions", {})
                }
            stats = await self._get_event_statistics()
            return {"summary_type": "event_statistics", "statistics": stats}

    async def _deliver_output(self, output: Dict[str, Any]) -> bool:
        """Delivery phase - Update memory.md with insights."""
        try:
            memory_config = self.config.get("pattern_analysis", {}).get("memory_integration", {})
            if not memory_config.get("enabled", True):
                return True

            summary_type = output.get("summary_type")
            if summary_type not in ["pattern_insights", "patterns_only"]:
                return True

            from .memory_integrator import MemoryIntegrator

            integrator = MemoryIntegrator(self._workspace_root)
            await integrator.update_memory(output)

            return True

        except Exception as e:
            logger.error(f"Memory update failed: {e}")
            return True  # Graceful degradation

    async def _store_output(self, output: Dict[str, Any]) -> bool:
        """Storage phase - Persist patterns to pattern_store and JSONL."""
        try:
            # Store to patterns.db (Phase 2)
            pattern_report = output.get("patterns")
            if pattern_report:
                from .pattern_store import PatternStore

                pattern_config = self.config.get("pattern_analysis", {})
                if pattern_config.get("pattern_storage", {}).get("enabled", True):
                    store = PatternStore(self._workspace_root)
                    await store.initialize()
                    await store.store_patterns(pattern_report)

            # Store to JSONL for compatibility (Phase 1)
            summaries_config = self.config.get("events_db", {}).get("summaries", {})
            if summaries_config.get("enabled", True):
                summary_path = Path(summaries_config.get("storage_path", ".aipmos/analytics/event_summaries.jsonl"))
                summary_path = self._workspace_root / summary_path
                summary_path.parent.mkdir(parents=True, exist_ok=True)

                with open(summary_path, "a") as f:
                    f.write(json.dumps(output, default=str) + "\n")

            return True

        except Exception as e:
            logger.error(f"Storage failed: {e}")
            return True  # Graceful degradation

    def _get_db_path(self) -> str:
        """Get events.db path from config."""
        db_name = self.config.get("events_db", {}).get("path", ".aipmos/events.db")
        return str(self._workspace_root / db_name)

    async def _init_database(self, db_path: str):
        """Initialize database schema if needed."""
        db_file = Path(db_path)

        # Create parent directory if needed
        db_file.parent.mkdir(parents=True, exist_ok=True)

        # Check if database already exists
        if db_file.exists():
            return

        # Initialize schema
        schema_file = Path(__file__).parent / "events_schema.sql"
        schema = schema_file.read_text()

        async with aiosqlite.connect(db_path) as db:
            await db.executescript(schema)
            await db.commit()

        logger.info(f"Initialized events database at {db_path}")

    def get_observer(self, observer_name: str) -> Optional[Any]:
        """Get specific observer instance by name."""
        return self.observers.get(observer_name)

    async def _get_event_statistics(self) -> Dict[str, Any]:
        """Get current event statistics from database."""
        db_path = self._get_db_path()
        stats = {}

        try:
            async with aiosqlite.connect(db_path) as db:
                # Total events
                cursor = await db.execute("SELECT COUNT(*) FROM events")
                stats["total_events"] = (await cursor.fetchone())[0]

                # Events by type
                cursor = await db.execute("""
                    SELECT event_type, COUNT(*) as count
                    FROM events
                    GROUP BY event_type
                    ORDER BY count DESC
                """)
                stats["by_type"] = {row[0]: row[1] for row in await cursor.fetchall()}

                # Recent events (last 24 hours)
                cursor = await db.execute("""
                    SELECT COUNT(*) FROM events
                    WHERE event_timestamp > datetime('now', '-1 day')
                """)
                stats["last_24_hours"] = (await cursor.fetchone())[0]

                # Session count
                cursor = await db.execute("""
                    SELECT COUNT(DISTINCT session_id) FROM events WHERE session_id IS NOT NULL
                """)
                stats["sessions"] = (await cursor.fetchone())[0]

        except Exception as e:
            logger.error(f"Failed to get event statistics: {e}")
            stats = {"error": str(e)}

        return stats
