"""
Functions for handling GTFS stop_times data.
"""

import csv
import os
from src.logger import get_logger

logger = get_logger("stop_times")


STOP_TIMES_BY_FEED: dict[str, dict[str, list["StopTime"]]] = {}
STOP_TIMES_BY_REQUEST: dict[
    tuple[str, frozenset[str]], dict[str, list["StopTime"]]
] = {}


class StopTime:
    """
    Class representing a stop time entry in the GTFS data.
    """

    def __init__(
        self,
        trip_id: str,
        arrival_time: str,
        departure_time: str,
        stop_id: str,
        stop_sequence: int,
        shape_dist_traveled: float | None,
    ):
        self.trip_id = trip_id
        self.arrival_time = arrival_time
        self.departure_time = departure_time
        self.stop_id = stop_id
        self.stop_sequence = stop_sequence
        self.shape_dist_traveled = shape_dist_traveled
        self.day_change = False  # New attribute to indicate day change

    def __str__(self):
        return f"StopTime({self.trip_id=}, {self.arrival_time=}, {self.departure_time=}, {self.stop_id=}, {self.stop_sequence=})"


def _load_stop_times_for_feed(feed_dir: str) -> dict[str, list[StopTime]]:
    """Load and cache all stop_times for a feed directory."""
    if feed_dir in STOP_TIMES_BY_FEED:
        return STOP_TIMES_BY_FEED[feed_dir]

    stops: dict[str, list[StopTime]] = {}

    try:
        with open(
            os.path.join(feed_dir, "stop_times.txt"), "r", encoding="utf-8", newline=""
        ) as stop_times_file:
            reader = csv.DictReader(stop_times_file)
            if reader.fieldnames is None:
                logger.error("stop_times.txt missing header row.")
                STOP_TIMES_BY_FEED[feed_dir] = {}
                return STOP_TIMES_BY_FEED[feed_dir]

            required_columns = [
                "trip_id",
                "arrival_time",
                "departure_time",
                "stop_id",
                "stop_sequence",
            ]
            missing_columns = [
                col for col in required_columns if col not in reader.fieldnames
            ]
            if missing_columns:
                logger.error(f"Required columns not found in header: {missing_columns}")
                STOP_TIMES_BY_FEED[feed_dir] = {}
                return STOP_TIMES_BY_FEED[feed_dir]

            has_shape_dist = "shape_dist_traveled" in reader.fieldnames
            if not has_shape_dist:
                logger.warning(
                    "Column 'shape_dist_traveled' not found in stop_times.txt. Distances will be set to None."
                )

            for row in reader:
                trip_id = row["trip_id"]
                if trip_id not in stops:
                    stops[trip_id] = []

                dist = None
                if has_shape_dist and row["shape_dist_traveled"]:
                    try:
                        dist = float(row["shape_dist_traveled"])
                    except ValueError:
                        pass

                try:
                    stops[trip_id].append(
                        StopTime(
                            trip_id=trip_id,
                            arrival_time=row["arrival_time"],
                            departure_time=row["departure_time"],
                            stop_id=row["stop_id"],
                            stop_sequence=int(row["stop_sequence"]),
                            shape_dist_traveled=dist,
                        )
                    )
                except ValueError as e:
                    logger.warning(
                        f"Error parsing stop_sequence for trip {trip_id}: {e}"
                    )

        for trip_stop_times in stops.values():
            trip_stop_times.sort(key=lambda st: st.stop_sequence)

    except FileNotFoundError:
        logger.warning("stop_times.txt file not found.")
        stops = {}

    STOP_TIMES_BY_FEED[feed_dir] = stops
    return stops


def get_stops_for_trips(
    feed_dir: str, trip_ids: list[str]
) -> dict[str, list[StopTime]]:
    """
    Get stops for a list of trip IDs based on the cached 'stop_times.txt' data.
    """
    if not trip_ids:
        return {}

    request_key = (feed_dir, frozenset(trip_ids))
    cached_subset = STOP_TIMES_BY_REQUEST.get(request_key)
    if cached_subset is not None:
        return cached_subset

    feed_cache = _load_stop_times_for_feed(feed_dir)
    if not feed_cache:
        STOP_TIMES_BY_REQUEST[request_key] = {}
        return {}

    result: dict[str, list[StopTime]] = {}
    seen: set[str] = set()
    for trip_id in trip_ids:
        if trip_id in seen:
            continue
        seen.add(trip_id)
        trip_stop_times = feed_cache.get(trip_id)
        if trip_stop_times:
            result[trip_id] = trip_stop_times

    STOP_TIMES_BY_REQUEST[request_key] = result
    return result
