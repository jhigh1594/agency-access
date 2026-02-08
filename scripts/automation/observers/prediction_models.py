"""
Phase 3: Predictive Suggestions - Data Models

This module defines data structures for generating and storing predictions
about user actions, workflows, timing, and session recommendations.

Design Principle: Statistical-first with AI enhancement. Works fully
without external AI, enhanced with Claude Code when available.
"""

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Optional, List
from typing import Dict, Any


class SuggestionType(Enum):
    """Types of predictions the system can generate."""
    COMMAND_NEXT = "command_next"
    FILE_RELATED = "file_related"
    WORKFLOW_COMPLETION = "workflow_completion"
    OPTIMAL_TIMING = "optimal_timing"
    SESSION_START = "session_start"


class Urgency(Enum):
    """Urgency level for suggestions."""
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class UserAction(Enum):
    """User response to a suggestion."""
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    IGNORED = "ignored"


@dataclass
class ActionSuggestion:
    """A predicted next action with confidence scoring.

    Attributes:
        suggestion_id: Unique identifier for this suggestion
        suggestion_type: Category of suggestion
        description: Human-readable description of the action
        command: Suggested command (if applicable)
        files: Related files (if applicable)
        confidence: 0.0 to 1.0 confidence score
        urgency: How urgent this action is
        rationale: Why this suggestion was made
        context_data: Additional context for the suggestion
        created_at: When this suggestion was generated
    """
    suggestion_id: str
    suggestion_type: SuggestionType
    description: str
    confidence: float
    urgency: Urgency = Urgency.MEDIUM
    command: Optional[str] = None
    files: List[str] = field(default_factory=list)
    rationale: Optional[str] = None
    context_data: Dict[str, Any] = field(default_factory=dict)
    created_at: datetime = field(default_factory=datetime.now)

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for storage."""
        return {
            "suggestion_id": self.suggestion_id,
            "suggestion_type": self.suggestion_type.value,
            "description": self.description,
            "command": self.command,
            "files": self.files,
            "confidence": self.confidence,
            "urgency": self.urgency.value,
            "rationale": self.rationale,
            "context_data": self.context_data,
            "created_at": self.created_at.isoformat()
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "ActionSuggestion":
        """Create from dictionary."""
        return cls(
            suggestion_id=data["suggestion_id"],
            suggestion_type=SuggestionType(data["suggestion_type"]),
            description=data["description"],
            command=data.get("command"),
            files=data.get("files", []),
            confidence=data["confidence"],
            urgency=Urgency(data.get("urgency", "medium")),
            rationale=data.get("rationale"),
            context_data=data.get("context_data", {}),
            created_at=datetime.fromisoformat(data["created_at"])
        )


@dataclass
class WorkflowPrediction:
    """Prediction for completing a partially-executed workflow.

    Attributes:
        workflow_name: Identified workflow pattern
        completed_steps: Steps already taken
        predicted_steps: Suggested next steps
        confidence: 0.0 to 1.0 confidence score
        estimated_remaining_steps: How many steps likely remain
        common_patterns: Historical patterns that informed this prediction
    """
    workflow_name: str
    completed_steps: List[str]
    predicted_steps: List[str]
    confidence: float
    estimated_remaining_steps: int
    common_patterns: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for storage."""
        return {
            "workflow_name": self.workflow_name,
            "completed_steps": self.completed_steps,
            "predicted_steps": self.predicted_steps,
            "confidence": self.confidence,
            "estimated_remaining_steps": self.estimated_remaining_steps,
            "common_patterns": self.common_patterns
        }


@dataclass
class TimingSuggestion:
    """Recommendation for optimal timing of an activity.

    Attributes:
        activity_type: Category of activity (e.g., "deep_work", "communication")
        current_hour: Current hour of day (0-23)
        optimal_hours: Best hours for this activity based on patterns
        current_score: How suitable current time is (0.0 to 1.0)
        rationale: Explanation of the timing recommendation
        peak_productivity_hours: Hours with highest success rates
        average_success_rate: Historical success rate at optimal times
    """
    activity_type: str
    current_hour: int
    optimal_hours: List[int]
    current_score: float
    rationale: str
    peak_productivity_hours: List[int] = field(default_factory=list)
    average_success_rate: float = 0.0

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for storage."""
        return {
            "activity_type": self.activity_type,
            "current_hour": self.current_hour,
            "optimal_hours": self.optimal_hours,
            "current_score": self.current_score,
            "rationale": self.rationale,
            "peak_productivity_hours": self.peak_productivity_hours,
            "average_success_rate": self.average_success_rate
        }


@dataclass
class SessionStartRecommendation:
    """Context-aware suggestions for starting a new session.

    Attributes:
        incomplete_workflows: Workflows from previous session that need completion
        active_file_clusters: File areas with recent activity
        high_value_suggestions: Top-priority suggestions based on context
        time_based_context: Recommendations based on time of day
        session_goal_suggestions: Suggested session objectives
    """
    incomplete_workflows: List[WorkflowPrediction]
    active_file_clusters: List[str]
    high_value_suggestions: List[ActionSuggestion]
    time_based_context: Optional[TimingSuggestion]
    session_goal_suggestions: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for storage."""
        return {
            "incomplete_workflows": [w.to_dict() for w in self.incomplete_workflows],
            "active_file_clusters": self.active_file_clusters,
            "high_value_suggestions": [s.to_dict() for s in self.high_value_suggestions],
            "time_based_context": self.time_based_context.to_dict() if self.time_based_context else None,
            "session_goal_suggestions": self.session_goal_suggestions
        }


@dataclass
class PredictionContext:
    """Current state for generating predictions.

    Attributes:
        recent_commands: Last N commands executed
        active_file_clusters: Files recently edited together
        time_of_day: Current hour (0-23)
        day_of_week: Current day (0=Monday, 6=Sunday)
        recent_activity: Recent event data
        session_phase: Where in the session (start, middle, end)
        current_goal: Inferred current objective
        workspace_root: Root directory of workspace
    """
    recent_commands: List[str] = field(default_factory=list)
    active_file_clusters: List[List[str]] = field(default_factory=list)
    time_of_day: int = 0
    day_of_week: int = 0
    recent_activity: List[Dict[str, Any]] = field(default_factory=list)
    session_phase: str = "unknown"
    current_goal: Optional[str] = None
    workspace_root: str = ""

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for storage."""
        return {
            "recent_commands": self.recent_commands,
            "active_file_clusters": self.active_file_clusters,
            "time_of_day": self.time_of_day,
            "day_of_week": self.day_of_week,
            "session_phase": self.session_phase,
            "current_goal": self.current_goal,
            "workspace_root": self.workspace_root
        }


@dataclass
class PredictionFeedback:
    """User feedback on a prediction for learning.

    Attributes:
        suggestion_id: ID of the suggestion being feedback on
        context_data: State when suggestion was made
        was_helpful: Whether user found it helpful
        actual_action: What user actually did
        feedback_timestamp: When feedback was recorded
        user_action: Accepted, rejected, or ignored
    """
    suggestion_id: str
    context_data: Dict[str, Any]
    was_helpful: Optional[bool] = None
    actual_action: Optional[str] = None
    feedback_timestamp: datetime = field(default_factory=datetime.now)
    user_action: Optional[UserAction] = None

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for storage."""
        return {
            "suggestion_id": self.suggestion_id,
            "context_data": self.context_data,
            "was_helpful": self.was_helpful,
            "actual_action": self.actual_action,
            "feedback_timestamp": self.feedback_timestamp.isoformat(),
            "user_action": self.user_action.value if self.user_action else None
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "PredictionFeedback":
        """Create from dictionary."""
        return cls(
            suggestion_id=data["suggestion_id"],
            context_data=data["context_data"],
            was_helpful=data.get("was_helpful"),
            actual_action=data.get("actual_action"),
            feedback_timestamp=datetime.fromisoformat(data["feedback_timestamp"]),
            user_action=UserAction(data["user_action"]) if data.get("user_action") else None
        )


@dataclass
class PredictionReport:
    """Complete prediction report for a session.

    Attributes:
        generated_at: When predictions were generated
        context: State used for predictions
        suggestions: All action suggestions
        workflow_prediction: Workflow completion predictions
        timing_suggestion: Optimal timing recommendations
        session_start: Session start recommendations
        metadata: Additional metadata about predictions
    """
    generated_at: datetime = field(default_factory=datetime.now)
    context: Optional[PredictionContext] = None
    suggestions: List[ActionSuggestion] = field(default_factory=list)
    workflow_prediction: Optional[WorkflowPrediction] = None
    timing_suggestion: Optional[TimingSuggestion] = None
    session_start: Optional[SessionStartRecommendation] = None
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for storage."""
        return {
            "generated_at": self.generated_at.isoformat(),
            "context": self.context.to_dict() if self.context else None,
            "suggestions": [s.to_dict() for s in self.suggestions],
            "workflow_prediction": self.workflow_prediction.to_dict() if self.workflow_prediction else None,
            "timing_suggestion": self.timing_suggestion.to_dict() if self.timing_suggestion else None,
            "session_start": self.session_start.to_dict() if self.session_start else None,
            "metadata": self.metadata
        }


# Type aliases for convenience
SuggestionId = str
ConfidenceScore = float
TransitionMatrix = Dict[str, Dict[str, int]]
