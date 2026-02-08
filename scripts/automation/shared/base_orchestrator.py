#!/usr/bin/env python3
"""
Base orchestrator for automated PM workflows.

Provides template method pattern for:
- Data collection
- Analysis
- Synthesis
- Delivery
- Storage
"""

import logging
import yaml
from abc import ABC, abstractmethod
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)


class BaseOrchestrator(ABC):
    """
    Abstract base class for automation workflows.

    Subclasses must implement:
    - _collect_data(): Gather raw data
    - _analyze_data(data): Process and filter
    - _synthesize_output(analyzed): Create deliverable

    Subclasses may override:
    - _deliver_output(output): Send to channels
    - _store_output(output): Save to storage
    """

    def __init__(self, config_path: str = "config.yaml"):
        """
        Initialize orchestrator.

        Args:
            config_path: Path to YAML config file
        """
        self.config_path = config_path
        self.config = self._load_config(config_path)
        logger.info(f"{self.__class__.__name__} initialized")

    def _load_config(self, path: str) -> Dict[str, Any]:
        """
        Load and parse YAML config file.

        Args:
            path: Path to config file

        Returns:
            Parsed config dictionary
        """
        try:
            config_file = Path(path)
            if not config_file.exists():
                logger.warning(f"Config file not found: {path}, using defaults")
                return {}

            with open(config_file, "r") as f:
                config = yaml.safe_load(f)
                logger.info(f"Loaded config from {path}")
                return config or {}
        except Exception as e:
            logger.error(f"Error loading config: {e}")
            return {}

    @abstractmethod
    async def _collect_data(self) -> Any:
        """
        Collect raw data from sources.

        Returns:
            Raw data in workflow-specific format
        """
        pass

    @abstractmethod
    def _analyze_data(self, data: Any) -> Any:
        """
        Analyze and filter collected data.

        Args:
            data: Raw data from _collect_data()

        Returns:
            Analyzed data ready for synthesis
        """
        pass

    @abstractmethod
    async def _synthesize_output(self, analyzed: Any) -> Any:
        """
        Synthesize analyzed data into deliverable output.

        Args:
            analyzed: Analyzed data from _analyze_data()

        Returns:
            Final output ready for delivery
        """
        pass

    async def _deliver_output(self, output: Any) -> bool:
        """
        Deliver output to configured channels.

        Override to implement delivery (Slack, email, etc.).

        Args:
            output: Synthesized output from _synthesize_output()

        Returns:
            True if delivery successful, False otherwise
        """
        logger.info("No delivery configured (override _deliver_output)")
        return True

    async def _store_output(self, output: Any) -> bool:
        """
        Store output for historical reference.

        Override to implement storage.

        Args:
            output: Synthesized output from _synthesize_output()

        Returns:
            True if storage successful, False otherwise
        """
        logger.info("No storage configured (override _store_output)")
        return True

    async def execute(self) -> Any:
        """
        Execute complete workflow.

        Template method that coordinates:
        1. Data collection
        2. Analysis
        3. Prediction (optional, if subclass implements _predict_suggestions)
        4. Synthesis
        5. Delivery
        6. Storage

        Returns:
            Final synthesized output
        """
        logger.info("=" * 60)
        logger.info(f"Starting {self.__class__.__name__} execution")
        logger.info("=" * 60)

        start_time = datetime.now()
        exit_code = 0

        try:
            # Phase 1: Collection
            logger.info("Phase 1: Data collection")
            data = await self._collect_data()
            if not data:
                logger.warning("No data collected")
                exit_code = 1
                result = None
            else:
                # Phase 2: Analysis
                logger.info("Phase 2: Analysis")
                # Check if _analyze_data is async (coroutine)
                import asyncio
                analysis_result = self._analyze_data(data)
                if asyncio.iscoroutine(analysis_result):
                    analyzed = await analysis_result
                else:
                    analyzed = analysis_result
                if not analyzed:
                    logger.warning("No data passed analysis")
                    exit_code = 1
                    result = None
                else:
                    # Phase 3: Prediction (optional)
                    predictions = {}
                    if hasattr(self, '_predict_suggestions'):
                        logger.info("Phase 3: Prediction")
                        prediction_result = self._predict_suggestions(analyzed)
                        if asyncio.iscoroutine(prediction_result):
                            predictions = await prediction_result
                        else:
                            predictions = prediction_result
                        # Add predictions to analyzed data for synthesis
                        if isinstance(analyzed, dict):
                            analyzed["predictions"] = predictions
                        else:
                            # Create wrapper if analyzed isn't a dict
                            analyzed = {"data": analyzed, "predictions": predictions}

                    # Phase 4: Synthesis
                    logger.info("Phase 4: Synthesis")
                    output = await self._synthesize_output(analyzed)
                    if not output:
                        logger.error("Synthesis failed")
                        exit_code = 1
                        result = None
                    else:
                        # Phase 5: Delivery
                        logger.info("Phase 5: Delivery")
                        await self._deliver_output(output)

                        # Phase 6: Storage
                        logger.info("Phase 6: Storage")
                        await self._store_output(output)

                        # Summary
                        elapsed = (datetime.now() - start_time).total_seconds()
                        logger.info("=" * 60)
                        logger.info(f"✓ Execution complete ({elapsed:.1f}s)")
                        logger.info("=" * 60)

                        result = output

            return result

        except Exception as e:
            logger.error(f"Fatal error during execution: {e}", exc_info=True)
            return None
