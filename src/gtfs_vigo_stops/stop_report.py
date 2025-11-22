import argparse
import os
import shutil
import sys
import time
import traceback
from typing import Any, Dict, List, Optional, Tuple

from src.shapes import process_shapes
from src.common import get_all_feed_dates
from src.download import download_feed_from_url
from src.logger import get_logger
from src.report_writer import write_stop_json, write_stop_protobuf
from src.routes import load_routes
from src.services import get_active_services
from src.stop_times import get_stops_for_trips, StopTime
from src.stops import get_all_stops, get_all_stops_by_code, get_numeric_code
from src.street_name import get_street_name, normalise_stop_name
from src.trips import get_trips_for_services, TripLine

logger = get_logger("stop_report")


def parse_args():
    parser = argparse.ArgumentParser(
        description="Generate stop-based JSON reports for a date or date range."
    )
    parser.add_argument(
        "--output-dir",
        type=str,
        default="./output/",
        help="Directory to write reports to (default: ./output/)",
    )
    parser.add_argument("--feed-dir", type=str,
                        help="Path to the feed directory")
    parser.add_argument(
        "--feed-url",
        type=str,
        help="URL to download the GTFS feed from (if not using local feed directory)",
    )
    parser.add_argument(
        "--force-download",
        action="store_true",
        help="Force download even if the feed hasn't been modified (only applies when using --feed-url)",
    )
    args = parser.parse_args()

    if args.feed_dir and args.feed_url:
        parser.error("Specify either --feed-dir or --feed-url, not both.")
    if not args.feed_dir and not args.feed_url:
        parser.error(
            "You must specify either a path to the existing feed (unzipped) or a URL to download the GTFS feed from."
        )
    if args.feed_dir and not os.path.exists(args.feed_dir):
        parser.error(f"Feed directory does not exist: {args.feed_dir}")
    return args


def time_to_seconds(time_str: str) -> int:
    """
    Convert HH:MM:SS to seconds since midnight.
    Handles GTFS times that can exceed 24 hours (e.g., 25:30:00 for 1:30 AM next day).
    """
    if not time_str:
        return 0

    parts = time_str.split(":")
    if len(parts) != 3:
        return 0

    try:
        hours, minutes, seconds = map(int, parts)
        return hours * 3600 + minutes * 60 + seconds
    except ValueError:
        return 0


def normalize_gtfs_time(time_str: str) -> str:
    """
    Normalize GTFS time format to standard HH:MM:SS (0-23 hours).
    Converts times like 25:30:00 to 01:30:00.

    Args:
        time_str: Time in HH:MM:SS format, possibly with hours >= 24

    Returns:
        Normalized time string in HH:MM:SS format
    """
    if not time_str:
        return time_str

    parts = time_str.split(":")
    if len(parts) != 3:
        return time_str

    try:
        hours, minutes, seconds = map(int, parts)
        normalized_hours = hours % 24
        return f"{normalized_hours:02d}:{minutes:02d}:{seconds:02d}"
    except ValueError:
        return time_str


def format_gtfs_time(time_str: str) -> str:
    """
    Format GTFS time to HH:MM:SS, preserving hours >= 24.
    """
    if not time_str:
        return time_str

    parts = time_str.split(":")
    if len(parts) != 3:
        return time_str

    try:
        hours, minutes, seconds = map(int, parts)
        return f"{hours:02d}:{minutes:02d}:{seconds:02d}"
    except ValueError:
        return time_str


def is_next_day_service(time_str: str) -> bool:
    """
    Check if a GTFS time represents a service on the next day (hours >= 24).

    Args:
        time_str: Time in HH:MM:SS format

    Returns:
        True if the time is >= 24:00:00, False otherwise
    """
    if not time_str:
        return False

    parts = time_str.split(":")
    if len(parts) != 3:
        return False

    try:
        hours = int(parts[0])
        return hours >= 24
    except ValueError:
        return False


def parse_trip_id_components(trip_id: str) -> Optional[Tuple[str, str, int]]:
    """
    Parse a trip ID in format XXXYYY-Z where:
    - XXX = line number (e.g., 003)
    - YYY = shift/internal ID (e.g., 001)
    - Z = trip number (e.g., 12)
    
    Full trip ID format is typically: service_id_date_XXXYYY-Z
    (e.g., "VIGO_20241122_003001-12")
    
    Returns tuple of (line, shift_id, trip_number) or None if parsing fails.
    """
    try:
        # Split by underscore - full format is service_id_date_XXXYYY-Z
        # We need at least 3 parts: service, date, and the actual trip ID
        parts = trip_id.split("_")
        if len(parts) < 3:
            return None
        
        # The trip ID is the last part in format XXXYYY-Z
        trip_part = parts[-1]  # Get the last part (e.g., "003001-12")
        
        if "-" not in trip_part:
            return None
        
        shift_part, trip_num_str = trip_part.split("-", 1)
        
        # shift_part should be 6 digits: XXXYYY
        if len(shift_part) != 6:
            return None
        
        line = shift_part[:3]  # First 3 digits
        shift_id = shift_part[3:6]  # Next 3 digits
        trip_number = int(trip_num_str)
        
        return (line, shift_id, trip_number)
    except (ValueError, IndexError):
        return None


def build_trip_previous_shape_map(
    trips: Dict[str, List[TripLine]],
    stops_for_all_trips: Dict[str, List[StopTime]],
) -> Dict[str, Optional[str]]:
    """
    Build a mapping from trip_id to previous_trip_shape_id.
    
    Links trips based on trip ID structure (XXXYYY-Z) where trips with the same
    XXX (line) and YYY (shift) and sequential Z (trip numbers) are connected
    if the terminus of trip N matches the start of trip N+1.
    
    Args:
        trips: Dictionary of service_id -> list of trips
        stops_for_all_trips: Dictionary of trip_id -> list of stop times
        
    Returns:
        Dictionary mapping trip_id to previous_trip_shape_id (or None)
    """
    trip_previous_shape: Dict[str, Optional[str]] = {}
    
    # Collect all trips across all services
    all_trips_list: List[TripLine] = []
    for trip_list in trips.values():
        all_trips_list.extend(trip_list)
    
    # Group trips by shift ID (line + shift combination)
    trips_by_shift: Dict[str, List[Tuple[TripLine, int, str, str]]] = {}
    
    for trip in all_trips_list:
        parsed = parse_trip_id_components(trip.trip_id)
        if not parsed:
            continue
        
        line, shift_id, trip_number = parsed
        shift_key = f"{line}{shift_id}"
        
        trip_stops = stops_for_all_trips.get(trip.trip_id)
        if not trip_stops or len(trip_stops) < 2:
            continue
        
        first_stop = trip_stops[0]
        last_stop = trip_stops[-1]
        
        if shift_key not in trips_by_shift:
            trips_by_shift[shift_key] = []
        
        trips_by_shift[shift_key].append((
            trip,
            trip_number,
            first_stop.stop_id,
            last_stop.stop_id
        ))
    
    # For each shift, sort trips by trip number and link consecutive trips
    for shift_key, shift_trips in trips_by_shift.items():
        # Sort by trip number
        shift_trips.sort(key=lambda x: x[1])
        
        # Link consecutive trips if their stops match
        for i in range(1, len(shift_trips)):
            current_trip, current_num, current_start_stop, _ = shift_trips[i]
            prev_trip, prev_num, _, prev_end_stop = shift_trips[i - 1]
            
            # Check if trips are consecutive (trip numbers differ by 1),
            # if previous trip's terminus matches current trip's start,
            # and if both trips have valid shape IDs
            if (current_num == prev_num + 1 and 
                prev_end_stop == current_start_stop and 
                prev_trip.shape_id and
                current_trip.shape_id):
                trip_previous_shape[current_trip.trip_id] = prev_trip.shape_id
    
    return trip_previous_shape


def get_stop_arrivals(feed_dir: str, date: str) -> Dict[str, List[Dict[str, Any]]]:
    """
    Process trips for the given date and organize stop arrivals.
    Also includes night services from the previous day (times >= 24:00:00).

    Args:
        feed_dir: Path to the GTFS feed directory
        date: Date in YYYY-MM-DD format

    Returns:
        Dictionary mapping stop_code to lists of arrival information.
    """
    from datetime import datetime, timedelta

    stops = get_all_stops(feed_dir)
    logger.info(f"Found {len(stops)} stops in the feed.")

    active_services = get_active_services(feed_dir, date)
    if not active_services:
        logger.info("No active services found for the given date.")

    logger.info(
        f"Found {len(active_services)} active services for date {date}.")

    # Also get services from the previous day to include night services (times >= 24:00)
    prev_date = (datetime.strptime(date, "%Y-%m-%d") -
                 timedelta(days=1)).strftime("%Y-%m-%d")
    prev_services = get_active_services(feed_dir, prev_date)
    logger.info(
        f"Found {len(prev_services)} active services for previous date {prev_date} (for night services).")

    all_services = list(set(active_services + prev_services))

    if not all_services:
        logger.info("No active services found for current or previous date.")
        return {}

    trips = get_trips_for_services(feed_dir, all_services)
    total_trip_count = sum(len(trip_list) for trip_list in trips.values())
    logger.info(f"Found {total_trip_count} trips for active services.")

    # Get all trip IDs
    all_trip_ids = [trip.trip_id for trip_list in trips.values()
                    for trip in trip_list]

    # Get stops for all trips
    stops_for_all_trips = get_stops_for_trips(feed_dir, all_trip_ids)
    logger.info(f"Precomputed stops for {len(stops_for_all_trips)} trips.")

    # Build mapping from trip_id to previous trip's shape_id
    trip_previous_shape_map = build_trip_previous_shape_map(trips, stops_for_all_trips)
    logger.info(f"Built previous trip shape mapping for {len(trip_previous_shape_map)} trips.")

    # Load routes information
    routes = load_routes(feed_dir)
    logger.info(f"Loaded {len(routes)} routes from feed.")

    # Create a reverse lookup from stop_id to stop_code
    stop_id_to_code = {}
    for stop_id, stop in stops.items():
        if stop.stop_code:
            stop_id_to_code[stop_id] = get_numeric_code(stop.stop_code)

    # Organize data by stop_code
    stop_arrivals = {}

    active_services_set = set(active_services)
    prev_services_set = set(prev_services)

    for service_id, trip_list in trips.items():
        is_active = service_id in active_services_set
        is_prev = service_id in prev_services_set

        if not is_active and not is_prev:
            continue

        for trip in trip_list:
            # Get route information once per trip
            route_info = routes.get(trip.route_id, {})
            route_short_name = route_info.get("route_short_name", "")
            trip_headsign = getattr(trip, "headsign", "") or ""
            trip_id = trip.trip_id

            # Get stop times for this trip
            trip_stops = stops_for_all_trips.get(trip.trip_id, [])
            if not trip_stops:
                continue

            # Pair stop_times with stop metadata once to avoid repeated lookups
            trip_stop_pairs = []
            stop_names = []
            for stop_time in trip_stops:
                stop = stops.get(stop_time.stop_id)
                trip_stop_pairs.append((stop_time, stop))
                stop_names.append(stop.stop_name if stop else "Unknown Stop")

            # Memoize street names per stop name for this trip and build segments
            street_cache: dict[str, str] = {}
            segment_names: list[str] = []
            stop_to_segment_idx: list[int] = []
            previous_street: str | None = None
            for name in stop_names:
                street = street_cache.get(name)
                if street is None:
                    street = get_street_name(name) or ""
                    street_cache[name] = street
                if street != previous_street:
                    segment_names.append(street)
                    previous_street = street
                stop_to_segment_idx.append(len(segment_names) - 1)

            # Precompute future street transitions per segment
            future_suffix_by_segment: list[tuple[str, ...]] = [
                ()] * len(segment_names)
            future_tuple: tuple[str, ...] = ()
            for idx in range(len(segment_names) - 1, -1, -1):
                future_suffix_by_segment[idx] = future_tuple
                current_street = segment_names[idx]
                future_tuple = (
                    (current_street,) + future_tuple
                    if current_street is not None
                    else future_tuple
                )

            segment_future_lists: dict[int, list[str]] = {}

            first_stop_time, first_stop = trip_stop_pairs[0]
            last_stop_time, last_stop = trip_stop_pairs[-1]

            starting_stop_name = first_stop.stop_name if first_stop else "Unknown Stop"
            terminus_stop_name = last_stop.stop_name if last_stop else "Unknown Stop"

            starting_code = get_numeric_code(
                first_stop.stop_code) if first_stop else ""
            terminus_code = get_numeric_code(
                last_stop.stop_code) if last_stop else ""

            starting_name = normalise_stop_name(starting_stop_name)
            terminus_name = normalise_stop_name(terminus_stop_name)
            starting_time = first_stop_time.departure_time
            terminus_time = last_stop_time.arrival_time

            # Determine processing passes for this trip
            passes = []
            if is_active:
                passes.append("current")
            if is_prev:
                passes.append("previous")

            for mode in passes:
                is_current_mode = (mode == "current")

                for i, (stop_time, _) in enumerate(trip_stop_pairs):
                    stop_code = stop_id_to_code.get(stop_time.stop_id)

                    if not stop_code:
                        continue  # Skip stops without a code

                    dep_time = stop_time.departure_time

                    if not is_current_mode:
                        # Previous day service: only include if calling_time >= 24:00:00 (night services rolling to this day)
                        if not is_next_day_service(dep_time):
                            continue

                        # Normalize times for display on current day (e.g. 25:30 -> 01:30)
                        final_starting_time = normalize_gtfs_time(
                            starting_time)
                        final_calling_time = normalize_gtfs_time(dep_time)
                        final_terminus_time = normalize_gtfs_time(
                            terminus_time)
                        # SSM should be small (early morning)
                        final_calling_ssm = time_to_seconds(final_calling_time)
                    else:
                        # Current day service: include ALL times
                        # Keep times as is (e.g. 25:30 stays 25:30)
                        final_starting_time = format_gtfs_time(starting_time)
                        final_calling_time = format_gtfs_time(dep_time)
                        final_terminus_time = format_gtfs_time(terminus_time)
                        # SSM should be large if > 24:00
                        final_calling_ssm = time_to_seconds(dep_time)

                    if stop_code not in stop_arrivals:
                        stop_arrivals[stop_code] = []

                    if segment_names:
                        segment_idx = stop_to_segment_idx[i]
                        if segment_idx not in segment_future_lists:
                            segment_future_lists[segment_idx] = list(
                                future_suffix_by_segment[segment_idx]
                            )
                        next_streets = segment_future_lists[segment_idx].copy()
                    else:
                        next_streets = []

                    trip_id_fmt = "_".join(trip_id.split("_")[1:3])
                    
                    # Get previous trip shape_id if available
                    previous_trip_shape_id = trip_previous_shape_map.get(trip_id, "")

                    stop_arrivals[stop_code].append(
                        {
                            "service_id": service_id.split("_")[1],
                            "trip_id": trip_id_fmt,
                            "line": route_short_name,
                            "route": trip_headsign,
                            "shape_id": getattr(trip, "shape_id", ""),
                            "stop_sequence": stop_time.stop_sequence,
                            "shape_dist_traveled": getattr(
                                stop_time, "shape_dist_traveled", 0
                            ),
                            "next_streets": next_streets,
                            "starting_code": starting_code,
                            "starting_name": starting_name,
                            "starting_time": final_starting_time,
                            "calling_time": final_calling_time,
                            "calling_ssm": final_calling_ssm,
                            "terminus_code": terminus_code,
                            "terminus_name": terminus_name,
                            "terminus_time": final_terminus_time,
                            "previous_trip_shape_id": previous_trip_shape_id,
                        }
                    )

    # Sort each stop's arrivals by arrival time
    for stop_code in stop_arrivals:
        # Filter out entries with None arrival_seconds
        stop_arrivals[stop_code] = [
            item for item in stop_arrivals[stop_code] if item["calling_ssm"] is not None
        ]
        stop_arrivals[stop_code].sort(key=lambda x: x["calling_ssm"])

    return stop_arrivals


def process_date(
    feed_dir: str, date: str, output_dir: str
) -> tuple[str, Dict[str, int]]:
    """
    Process a single date and write its stop JSON files.
    Returns summary data for index generation.
    """
    logger = get_logger(f"stop_report_{date}")
    try:
        logger.info(f"Starting stop report generation for date {date}")

        stops_by_code = get_all_stops_by_code(feed_dir)

        # Get all stop arrivals for the current date
        stop_arrivals = get_stop_arrivals(feed_dir, date)

        if not stop_arrivals:
            logger.warning(f"No stop arrivals found for date {date}")
            return date, {}

        logger.info(
            f"Writing stop reports for {len(stop_arrivals)} stops for date {date}"
        )

        # Write individual stop JSON files
        writing_start_time = time.perf_counter()
        for stop_code, arrivals in stop_arrivals.items():
            write_stop_json(output_dir, date, stop_code, arrivals)
        writing_end_time = time.perf_counter()
        writing_elapsed = writing_end_time - writing_start_time

        logger.info(
            f"Finished writing stop JSON reports for date {date} in {writing_elapsed:.2f}s"
        )

        # Write individual stop JSON files
        writing_start_time = time.perf_counter()
        for stop_code, arrivals in stop_arrivals.items():
            stop_by_code = stops_by_code.get(stop_code)

            if stop_by_code is not None:
                write_stop_protobuf(
                    output_dir,
                    date,
                    stop_code,
                    arrivals,
                    stop_by_code.stop_25829_x or 0.0,
                    stop_by_code.stop_25829_y or 0.0,
                )

        writing_end_time = time.perf_counter()
        writing_elapsed = writing_end_time - writing_start_time

        logger.info(
            f"Finished writing stop protobuf reports for date {date} in {writing_elapsed:.2f}s"
        )

        logger.info(f"Processed {len(stop_arrivals)} stops for date {date}")

        stop_summary = {
            stop_code: len(arrivals) for stop_code, arrivals in stop_arrivals.items()
        }
        return date, stop_summary
    except Exception as e:
        logger.error(f"Error processing date {date}: {e}")
        raise


def main():
    args = parse_args()
    output_dir = args.output_dir
    feed_url = args.feed_url

    if not feed_url:
        feed_dir = args.feed_dir
    else:
        logger.info(f"Downloading GTFS feed from {feed_url}...")
        feed_dir = download_feed_from_url(
            feed_url, output_dir, args.force_download)
        if feed_dir is None:
            logger.info("Download was skipped (feed not modified). Exiting.")
            return

    all_dates = get_all_feed_dates(feed_dir)
    if not all_dates:
        logger.error("No valid dates found in feed.")
        return
    date_list = all_dates

    # Ensure date_list is not empty before processing
    if not date_list:
        logger.error("No valid dates to process.")
        return

    logger.info(f"Processing {len(date_list)} dates")

    # Dictionary to store summary data for index files
    all_stops_summary = {}

    for date in date_list:
        _, stop_summary = process_date(feed_dir, date, output_dir)
        all_stops_summary[date] = stop_summary

    logger.info(
        "Finished processing all dates. Beginning with shape transformation.")

    # Process shapes, converting each coordinate to EPSG:25829 and saving as Protobuf
    process_shapes(feed_dir, output_dir)

    logger.info("Finished processing shapes.")

    if feed_url:
        if os.path.exists(feed_dir):
            shutil.rmtree(feed_dir)
            logger.info(f"Removed temporary feed directory: {feed_dir}")


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        logger = get_logger("stop_report")
        logger.critical(f"An unexpected error occurred: {e}", exc_info=True)
        traceback.print_exc()
        sys.exit(1)
