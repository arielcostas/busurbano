"""

Rolling dates module.

Handles mapping of future dates not in a GTFS feed to equivalent dates that exist in the feed.
This allows extending feed coverage by reusing data from past dates.
"""
import json
import os
from typing import Optional, Dict, Tuple
from datetime import datetime
from src.logger import get_logger

logger = get_logger("rolling_dates")


class RollingDateConfig:
    """
    Manages rolling date mappings from a configuration file.

    The configuration file should be a JSON file with the following format:
    {
        "2025-09-30": "2025-09-24",
        "2025-10-01": "2025-09-25"
    }

    Where keys are the target dates (not in feed) and values are the source dates (in feed).
    """

    def __init__(self, config_path: Optional[str] = None):
        """
        Initialize the rolling date configuration.

        Args:
            config_path: Path to the JSON configuration file. If None, no mapping is active.
        """
        self.mappings: Dict[str, str] = {}
        self.config_path = config_path

        if config_path:
            self._load_config(config_path)

    def _load_config(self, config_path: str):
        """
        Load rolling date mappings from a JSON file.

        Args:
            config_path: Path to the JSON configuration file.

        Raises:
            FileNotFoundError: If the config file doesn't exist.
            json.JSONDecodeError: If the config file is not valid JSON.
            ValueError: If the config file has invalid date formats.
        """
        if not os.path.exists(config_path):
            raise FileNotFoundError(f"Rolling dates config file not found: {config_path}")

        try:
            with open(config_path, 'r', encoding='utf-8') as f:
                data = json.load(f)

            # Validate that data is a dictionary
            if not isinstance(data, dict):
                raise ValueError("Rolling dates config must be a JSON object (dictionary)")

            # Validate date formats
            for target_date, source_date in data.items():
                self._validate_date_format(target_date, "target")
                self._validate_date_format(source_date, "source")

            self.mappings = data
            logger.info(f"Loaded {len(self.mappings)} rolling date mappings from {config_path}")

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse rolling dates config: {e}")
            raise
        except Exception as e:
            logger.error(f"Error loading rolling dates config: {e}")
            raise

    def _validate_date_format(self, date_str: str, date_type: str):
        """
        Validate that a date string is in YYYY-MM-DD format.

        Args:
            date_str: The date string to validate.
            date_type: Type of date (for error messages).

        Raises:
            ValueError: If the date format is invalid.
        """
        try:
            datetime.strptime(date_str, '%Y-%m-%d')
        except ValueError:
            raise ValueError(
                f"Invalid {date_type} date format '{date_str}'. "
                f"Expected YYYY-MM-DD format."
            )

    def get_source_date(self, target_date: str) -> Optional[str]:
        """
        Get the source date for a given target date.

        Args:
            target_date: The date to look up (YYYY-MM-DD format).

        Returns:
            The source date if a mapping exists, None otherwise.
        """
        return self.mappings.get(target_date)

    def is_rolling_date(self, date: str) -> bool:
        """
        Check if a date is a rolling date (has a mapping).

        Args:
            date: The date to check (YYYY-MM-DD format).

        Returns:
            True if the date has a rolling mapping, False otherwise.
        """
        return date in self.mappings

    def get_mapping_info(self, target_date: str) -> Optional[Tuple[str, str]]:
        """
        Get complete mapping information for a target date.

        Args:
            target_date: The date to look up (YYYY-MM-DD format).

        Returns:
            Tuple of (source_date, target_date) if mapping exists, None otherwise.
        """
        source_date = self.get_source_date(target_date)
        if source_date:
            return (source_date, target_date)
        return None

    def has_mappings(self) -> bool:
        """
        Check if any rolling date mappings are configured.

        Returns:
            True if at least one mapping exists, False otherwise.
        """
        return len(self.mappings) > 0

    def get_all_mappings(self) -> Dict[str, str]:
        """
        Get all configured rolling date mappings.

        Returns:
            Dictionary of target_date -> source_date mappings.
        """
        return self.mappings.copy()


def create_rolling_date_config(config_path: Optional[str] = None) -> RollingDateConfig:
    """
    Factory function to create a RollingDateConfig instance.

    Args:
        config_path: Path to the JSON configuration file. If None, returns an empty config.

    Returns:
        RollingDateConfig instance.
    """
    return RollingDateConfig(config_path)
