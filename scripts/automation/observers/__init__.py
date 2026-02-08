"""
Observers for memory system.

Phase 1 - Passive Event Capture:
- CommandUsageObserver: CLI command/skill usage
- FileClustersObserver: Files edited together (work patterns)
- TimePatternsObserver: Session timing and activity patterns
- SuccessSignalsObserver: Git commits, task completions, outcomes

Phase 2 - Pattern Detection & Learning:
- PatternAnalyzer: Statistical pattern extraction from events
- InsightGenerator: Pattern formatting and statistical insights
- PatternStore: Long-term pattern persistence (patterns.db)
- MemoryIntegrator: Updates memory.md with pattern insights
- EventOrchestrator: Coordinates the full pipeline

Phase 3 - Predictive Suggestions:
- PatternPredictor: Statistical prediction engine for next actions
- PredictionStore: Prediction history and user feedback tracking
- PredictionFormatter: Format predictions for display
- prediction_models: Data structures for predictions

Phase 4 - Executive Intelligence & Proactive Synthesis:
- executive_models: Data structures for executive insights
- TrendAnalyzer: Week-over-week analysis and anomaly detection
- AlertSystem: Strategic alert generation
- GoalAwareRecommender: OKR correlation and recommendations
- ExecutiveSynthesizer: Unified executive report generation
"""

from .base_observer import BaseObserver
from .observer_manager import ObserverManager
from .pattern_models import (
    PatternReport,
    CommandSequence,
    FileCluster,
    TimePatternSummary,
    SuccessCorrelation,
    InsightReport,
)
from .pattern_analyzer import PatternAnalyzer
from .insight_generator import InsightGenerator
from .pattern_store import PatternStore
from .memory_integrator import MemoryIntegrator
from .event_orchestrator import EventOrchestrator

# Phase 3: Predictive Suggestions
from .predictor import PatternPredictor
from .prediction_store import PredictionStore
from .prediction_formatter import PredictionFormatter
from . import prediction_models
from .prediction_models import (
    ActionSuggestion,
    WorkflowPrediction,
    TimingSuggestion,
    SessionStartRecommendation,
    PredictionContext,
    PredictionFeedback,
    PredictionReport,
    SuggestionType,
    Urgency,
    UserAction,
)

# Phase 4: Executive Intelligence
from . import executive_models
from .executive_models import (
    WeeklySnapshot,
    TrendMetric,
    ExecutiveAlert,
    GoalCorrelation,
    ExecutiveInsightReport,
    TrendDirection,
    TrendSignificance,
    AlertSeverity,
    AlertCategory,
    ProgressIndicator,
)
from .trend_analyzer import TrendAnalyzer
from .alert_system import AlertSystem
from .goal_recommender import GoalAwareRecommender
from .executive_synthesizer import ExecutiveSynthesizer

__all__ = [
    # Phase 1
    'BaseObserver',
    'ObserverManager',
    # Phase 2
    'PatternReport',
    'CommandSequence',
    'FileCluster',
    'TimePatternSummary',
    'SuccessCorrelation',
    'InsightReport',
    'PatternAnalyzer',
    'InsightGenerator',
    'PatternStore',
    'MemoryIntegrator',
    'EventOrchestrator',
    # Phase 3
    'PatternPredictor',
    'PredictionStore',
    'PredictionFormatter',
    'prediction_models',
    'ActionSuggestion',
    'WorkflowPrediction',
    'TimingSuggestion',
    'SessionStartRecommendation',
    'PredictionContext',
    'PredictionFeedback',
    'PredictionReport',
    'SuggestionType',
    'Urgency',
    'UserAction',
    # Phase 4
    'executive_models',
    'WeeklySnapshot',
    'TrendMetric',
    'ExecutiveAlert',
    'GoalCorrelation',
    'ExecutiveInsightReport',
    'TrendDirection',
    'TrendSignificance',
    'AlertSeverity',
    'AlertCategory',
    'ProgressIndicator',
    'TrendAnalyzer',
    'AlertSystem',
    'GoalAwareRecommender',
    'ExecutiveSynthesizer',
]
