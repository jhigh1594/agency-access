"""
Phase 3: Predictive Suggestions - Prediction Store

This module manages storage and retrieval of prediction history and user feedback.
Extends the patterns.db database with prediction tracking for learning and improvement.

Design: Separate tables for prediction history and feedback to enable
long-term pattern learning without bloating the main events database.
"""

import sqlite3
import json
from datetime import datetime, timedelta
from pathlib import Path
from typing import List, Optional, Dict, Any
from contextlib import contextmanager

from .prediction_models import (
    ActionSuggestion,
    PredictionFeedback,
    PredictionReport,
    SuggestionType,
    UserAction
)


class PredictionStore:
    """Manages prediction history and user feedback for learning."""

    def __init__(self, db_path: str):
        """Initialize the prediction store.

        Args:
            db_path: Path to patterns.db database
        """
        self.db_path = db_path
        self._ensure_tables()

    @contextmanager
    def _get_connection(self) -> sqlite3.Connection:
        """Get a database connection with proper configuration."""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys = ON")
        conn.execute("PRAGMA journal_mode = WAL")
        yield conn
        conn.close()

    def _ensure_tables(self) -> None:
        """Create prediction tables if they don't exist."""
        with self._get_connection() as conn:
            # Main prediction history table
            conn.execute("""
                CREATE TABLE IF NOT EXISTS prediction_history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    suggestion_id TEXT NOT NULL UNIQUE,
                    suggestion_type TEXT NOT NULL,
                    suggestion_data TEXT NOT NULL,
                    confidence REAL NOT NULL,
                    shown_to_user BOOLEAN DEFAULT FALSE,
                    user_action TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            """)

            # User feedback table for learning
            conn.execute("""
                CREATE TABLE IF NOT EXISTS prediction_feedback (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    suggestion_id TEXT NOT NULL,
                    context_data TEXT NOT NULL,
                    was_helpful BOOLEAN,
                    actual_action TEXT,
                    feedback_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (suggestion_id) REFERENCES prediction_history(suggestion_id)
                )
            """)

            # Performance tracking for prediction accuracy
            conn.execute("""
                CREATE TABLE IF NOT EXISTS prediction_performance (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    date DATE NOT NULL,
                    suggestion_type TEXT NOT NULL,
                    total_shown INTEGER DEFAULT 0,
                    accepted INTEGER DEFAULT 0,
                    rejected INTEGER DEFAULT 0,
                    ignored INTEGER DEFAULT 0,
                    avg_confidence REAL,
                    UNIQUE(date, suggestion_type)
                )
            """)

            # Create indexes for common queries
            conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_prediction_history_type
                ON prediction_history(suggestion_type)
            """)
            conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_prediction_history_created
                ON prediction_history(created_at)
            """)
            conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_prediction_feedback_suggestion
                ON prediction_feedback(suggestion_id)
            """)
            conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_prediction_performance_date
                ON prediction_performance(date)
            """)

            conn.commit()

    def save_prediction(
        self,
        suggestion: ActionSuggestion,
        shown_to_user: bool = False
    ) -> bool:
        """Save a prediction to history.

        Args:
            suggestion: The action suggestion to save
            shown_to_user: Whether this was shown to the user

        Returns:
            True if saved successfully
        """
        try:
            with self._get_connection() as conn:
                conn.execute("""
                    INSERT OR REPLACE INTO prediction_history
                    (suggestion_id, suggestion_type, suggestion_data, confidence, shown_to_user)
                    VALUES (?, ?, ?, ?, ?)
                """, (
                    suggestion.suggestion_id,
                    suggestion.suggestion_type.value,
                    json.dumps(suggestion.to_dict()),
                    suggestion.confidence,
                    shown_to_user
                ))
                conn.commit()
                return True
        except Exception as e:
            print(f"Error saving prediction: {e}")
            return False

    def save_predictions_batch(
        self,
        suggestions: List[ActionSuggestion],
        shown_to_user: bool = False
    ) -> int:
        """Save multiple predictions efficiently.

        Args:
            suggestions: List of suggestions to save
            shown_to_user: Whether these were shown to the user

        Returns:
            Number of predictions saved
        """
        saved_count = 0
        try:
            with self._get_connection() as conn:
                for suggestion in suggestions:
                    try:
                        conn.execute("""
                            INSERT OR REPLACE INTO prediction_history
                            (suggestion_id, suggestion_type, suggestion_data, confidence, shown_to_user)
                            VALUES (?, ?, ?, ?, ?)
                        """, (
                            suggestion.suggestion_id,
                            suggestion.suggestion_type.value,
                            json.dumps(suggestion.to_dict()),
                            suggestion.confidence,
                            shown_to_user
                        ))
                        saved_count += 1
                    except Exception:
                        continue
                conn.commit()
        except Exception as e:
            print(f"Error in batch save: {e}")
        return saved_count

    def record_feedback(self, feedback: PredictionFeedback) -> bool:
        """Record user feedback on a prediction.

        Args:
            feedback: The feedback to record

        Returns:
            True if recorded successfully
        """
        try:
            with self._get_connection() as conn:
                # Update the prediction history with user action
                if feedback.user_action:
                    conn.execute("""
                        UPDATE prediction_history
                        SET user_action = ?, updated_at = CURRENT_TIMESTAMP
                        WHERE suggestion_id = ?
                    """, (feedback.user_action.value, feedback.suggestion_id))

                # Insert detailed feedback
                conn.execute("""
                    INSERT INTO prediction_feedback
                    (suggestion_id, context_data, was_helpful, actual_action, feedback_timestamp)
                    VALUES (?, ?, ?, ?, ?)
                """, (
                    feedback.suggestion_id,
                    json.dumps(feedback.context_data),
                    feedback.was_helpful,
                    feedback.actual_action,
                    feedback.feedback_timestamp.isoformat()
                ))

                # Update performance metrics
                self._update_performance_metrics(conn, feedback)

                conn.commit()
                return True
        except Exception as e:
            print(f"Error recording feedback: {e}")
            return False

    def _update_performance_metrics(
        self,
        conn: sqlite3.Connection,
        feedback: PredictionFeedback
    ) -> None:
        """Update daily performance metrics for a suggestion type.

        Args:
            conn: Database connection
            feedback: Feedback to record metrics for
        """
        # Get the suggestion type from history
        cursor = conn.execute(
            "SELECT suggestion_type, confidence FROM prediction_history WHERE suggestion_id = ?",
            (feedback.suggestion_id,)
        )
        row = cursor.fetchone()
        if not row:
            return

        suggestion_type = row["suggestion_type"]
        avg_confidence = row["confidence"]

        today = datetime.now().date()

        # Determine which counter to increment
        action_column = None
        if feedback.user_action == UserAction.ACCEPTED:
            action_column = "accepted"
        elif feedback.user_action == UserAction.REJECTED:
            action_column = "rejected"
        elif feedback.user_action == UserAction.IGNORED:
            action_column = "ignored"

        # Upsert performance record
        if action_column:
            conn.execute(f"""
                INSERT INTO prediction_performance (date, suggestion_type, total_shown, {action_column}, avg_confidence)
                VALUES (?, ?, 1, 1, ?)
                ON CONFLICT(date, suggestion_type) DO UPDATE SET
                    total_shown = total_shown + 1,
                    {action_column} = {action_column} + 1,
                    avg_confidence = (
                        (SELECT avg_confidence FROM prediction_performance WHERE date = ? AND suggestion_type = ?) * (total_shown - 1) + ?
                    ) / total_shown
            """, (today, suggestion_type, avg_confidence, today, suggestion_type, avg_confidence))

    def get_recent_predictions(
        self,
        limit: int = 50,
        suggestion_type: Optional[SuggestionType] = None
    ) -> List[Dict[str, Any]]:
        """Get recent predictions from history.

        Args:
            limit: Maximum number of predictions to return
            suggestion_type: Filter by suggestion type

        Returns:
            List of prediction dictionaries
        """
        try:
            with self._get_connection() as conn:
                query = "SELECT * FROM prediction_history"
                params = []

                if suggestion_type:
                    query += " WHERE suggestion_type = ?"
                    params.append(suggestion_type.value)

                query += " ORDER BY created_at DESC LIMIT ?"
                params.append(limit)

                cursor = conn.execute(query, params)
                rows = cursor.fetchall()

                results = []
                for row in rows:
                    suggestion_data = json.loads(row["suggestion_data"])
                    results.append({
                        "id": row["id"],
                        "suggestion_id": row["suggestion_id"],
                        "suggestion_type": row["suggestion_type"],
                        "suggestion": suggestion_data,
                        "shown_to_user": row["shown_to_user"],
                        "user_action": row["user_action"],
                        "created_at": row["created_at"]
                    })
                return results
        except Exception as e:
            print(f"Error getting recent predictions: {e}")
            return []

    def get_feedback_for_suggestion(
        self,
        suggestion_id: str
    ) -> List[PredictionFeedback]:
        """Get all feedback for a specific suggestion.

        Args:
            suggestion_id: ID of the suggestion

        Returns:
            List of feedback records
        """
        try:
            with self._get_connection() as conn:
                cursor = conn.execute("""
                    SELECT * FROM prediction_feedback
                    WHERE suggestion_id = ?
                    ORDER BY feedback_timestamp DESC
                """, (suggestion_id,))

                feedback_list = []
                for row in cursor.fetchall():
                    feedback_list.append(PredictionFeedback(
                        suggestion_id=row["suggestion_id"],
                        context_data=json.loads(row["context_data"]),
                        was_helpful=row["was_helpful"],
                        actual_action=row["actual_action"],
                        feedback_timestamp=datetime.fromisoformat(row["feedback_timestamp"])
                    ))
                return feedback_list
        except Exception as e:
            print(f"Error getting feedback: {e}")
            return []

    def get_performance_metrics(
        self,
        days: int = 30,
        suggestion_type: Optional[SuggestionType] = None
    ) -> List[Dict[str, Any]]:
        """Get performance metrics for predictions.

        Args:
            days: Number of days to look back
            suggestion_type: Filter by suggestion type

        Returns:
            List of daily performance metrics
        """
        try:
            with self._get_connection() as conn:
                cutoff_date = (datetime.now() - timedelta(days=days)).date()

                query = """
                    SELECT * FROM prediction_performance
                    WHERE date >= ?
                """
                params = [cutoff_date.isoformat()]

                if suggestion_type:
                    query += " AND suggestion_type = ?"
                    params.append(suggestion_type.value)

                query += " ORDER BY date DESC"

                cursor = conn.execute(query, params)
                return [dict(row) for row in cursor.fetchall()]
        except Exception as e:
            print(f"Error getting performance metrics: {e}")
            return []

    def get_acceptance_rate(
        self,
        suggestion_type: Optional[SuggestionType] = None,
        days: int = 7
    ) -> float:
        """Calculate acceptance rate for predictions.

        Args:
            suggestion_type: Filter by suggestion type
            days: Number of days to look back

        Returns:
            Acceptance rate (0.0 to 1.0)
        """
        metrics = self.get_performance_metrics(days, suggestion_type)
        if not metrics:
            return 0.0

        total_accepted = sum(m.get("accepted", 0) for m in metrics)
        total_shown = sum(m.get("total_shown", 0) for m in metrics)

        if total_shown == 0:
            return 0.0

        return total_accepted / total_shown

    def cleanup_old_predictions(self, retention_days: int = 30) -> int:
        """Remove old predictions to prevent database bloat.

        Args:
            retention_days: Days to keep predictions

        Returns:
            Number of predictions removed
        """
        try:
            with self._get_connection() as conn:
                cutoff = (datetime.now() - timedelta(days=retention_days)).isoformat()

                cursor = conn.execute("""
                    DELETE FROM prediction_history
                    WHERE created_at < ? AND user_action IS NULL
                """, (cutoff,))

                deleted_count = cursor.rowcount

                # Also clean up old feedback for deleted predictions
                conn.execute("""
                    DELETE FROM prediction_feedback
                    WHERE suggestion_id NOT IN (SELECT suggestion_id FROM prediction_history)
                """)

                # Clean up old performance metrics
                old_date = (datetime.now() - timedelta(days=90)).isoformat()
                conn.execute("DELETE FROM prediction_performance WHERE date < ?", (old_date,))

                conn.commit()
                return deleted_count
        except Exception as e:
            print(f"Error cleaning up predictions: {e}")
            return 0

    def save_prediction_report(self, report: PredictionReport) -> bool:
        """Save a complete prediction report.

        Args:
            report: The prediction report to save

        Returns:
            True if saved successfully
        """
        try:
            # Save all suggestions in the report
            saved_count = self.save_predictions_batch(
                report.suggestions,
                shown_to_user=True
            )

            # Store report metadata for reference
            report_id = f"report_{report.generated_at.timestamp()}"
            report_data = json.dumps(report.to_dict())

            with self._get_connection() as conn:
                conn.execute("""
                    INSERT OR REPLACE INTO prediction_history
                    (suggestion_id, suggestion_type, suggestion_data, confidence, shown_to_user)
                    VALUES (?, ?, ?, ?, ?)
                """, (report_id, "session_report", report_data, 1.0, True))
                conn.commit()

            return saved_count > 0
        except Exception as e:
            print(f"Error saving prediction report: {e}")
            return False
