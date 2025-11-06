import os
import shutil
import sys
import traceback
import argparse
from typing import List, Dict, Any
from multiprocessing import Pool, cpu_count

from src.download import download_feed_from_url
from src.logger import get_logger
from src.common import get_all_feed_dates, time_to_seconds
from src.stops import get_all_stops
from src.services import get_active_services
from src.street_name import get_street_name, normalise_stop_name
from src.trips import get_trips_for_services
from src.stop_times import get_stops_for_trips
from src.routes import load_routes
from src.report_writer import write_stop_json

logger = get_logger("stop_report")


def parse_args():
    parser = argparse.ArgumentParser(
        description="Generate stop-based JSON reports for a date or date range.")
    parser.add_argument('--output-dir', type=str, default="./output/",
                        help='Directory to write reports to (default: ./output/)')
    parser.add_argument('--feed-dir', type=str,
                        help="Path to the feed directory")
    parser.add_argument('--feed-url', type=str,
                        help="URL to download the GTFS feed from (if not using local feed directory)")
    parser.add_argument('--force-download', action='store_true',
                        help="Force download even if the feed hasn't been modified (only applies when using --feed-url)")
    args = parser.parse_args()

    if args.feed_dir and args.feed_url:
        parser.error("Specify either --feed-dir or --feed-url, not both.")
    if not args.feed_dir and not args.feed_url:
        parser.error(
            "You must specify either a path to the existing feed (unzipped) or a URL to download the GTFS feed from.")
    if args.feed_dir and not os.path.exists(args.feed_dir):
        parser.error(f"Feed directory does not exist: {args.feed_dir}")
    return args


def time_to_seconds(time_str: str) -> int:
    """Convert HH:MM:SS to seconds since midnight."""
    if not time_str:
        return 0

    parts = time_str.split(':')
    if len(parts) != 3:
        return 0

    try:
        hours, minutes, seconds = map(int, parts)
        return hours * 3600 + minutes * 60 + seconds
    except ValueError:
        return 0


def get_numeric_code(stop_code: str | None) -> str:
    if not stop_code:
        return ""
    numeric_code = ''.join(c for c in stop_code if c.isdigit())
    return str(int(numeric_code)) if numeric_code else ""


def get_stop_arrivals(
    feed_dir: str,
    date: str
) -> Dict[str, List[Dict[str, Any]]]:
    """
    Process trips for the given date and organize stop arrivals.

    Args:
        feed_dir: Path to the GTFS feed directory
        date: Date in YYYY-MM-DD format
        numeric_stop_code: If True, strip non-numeric characters from stop codes

    Returns:
        Dictionary mapping stop_code to lists of arrival information.
    """
    stops = get_all_stops(feed_dir)
    logger.info(f"Found {len(stops)} stops in the feed.")

    active_services = get_active_services(feed_dir, date)
    if not active_services:
        logger.info("No active services found for the given date.")
        return {}

    logger.info(
        f"Found {len(active_services)} active services for date {date}.")

    trips = get_trips_for_services(feed_dir, active_services)
    total_trip_count = sum(len(trip_list) for trip_list in trips.values())
    logger.info(f"Found {total_trip_count} trips for active services.")

    # Get all trip IDs
    all_trip_ids = [trip.trip_id for trip_list in trips.values()
                    for trip in trip_list]

    # Get stops for all trips
    stops_for_all_trips = get_stops_for_trips(feed_dir, all_trip_ids)
    logger.info(f"Precomputed stops for {len(stops_for_all_trips)} trips.")

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

    for service_id, trip_list in trips.items():
        for trip in trip_list:
            # Get route information once per trip
            route_info = routes.get(trip.route_id, {})
            route_short_name = route_info.get('route_short_name', '')
            trip_headsign = getattr(trip, 'headsign', '') or ''
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
            future_suffix_by_segment: list[tuple[str, ...]] = [()] * len(segment_names)
            future_tuple: tuple[str, ...] = ()
            for idx in range(len(segment_names) - 1, -1, -1):
                future_suffix_by_segment[idx] = future_tuple
                current_street = segment_names[idx]
                future_tuple = (current_street,) + future_tuple if current_street is not None else future_tuple

            segment_future_lists: dict[int, list[str]] = {}

            first_stop_time, first_stop = trip_stop_pairs[0]
            last_stop_time, last_stop = trip_stop_pairs[-1]

            starting_stop_name = first_stop.stop_name if first_stop else "Unknown Stop"
            terminus_stop_name = last_stop.stop_name if last_stop else "Unknown Stop"

            starting_code = get_numeric_code(first_stop.stop_code) if first_stop else ""
            terminus_code = get_numeric_code(last_stop.stop_code) if last_stop else ""

            starting_name = normalise_stop_name(starting_stop_name)
            terminus_name = normalise_stop_name(terminus_stop_name)
            starting_time = first_stop_time.departure_time
            terminus_time = last_stop_time.arrival_time

            for i, (stop_time, _) in enumerate(trip_stop_pairs):
                stop_code = stop_id_to_code.get(stop_time.stop_id)

                if not stop_code:
                    continue  # Skip stops without a code

                if stop_code not in stop_arrivals:
                    stop_arrivals[stop_code] = []

                if segment_names:
                    segment_idx = stop_to_segment_idx[i]
                    if segment_idx not in segment_future_lists:
                        segment_future_lists[segment_idx] = list(future_suffix_by_segment[segment_idx])
                    next_streets = segment_future_lists[segment_idx].copy()
                else:
                    next_streets = []

                stop_arrivals[stop_code].append({
                    "trip_id": trip_id,
                    "service_id": service_id,
                    "line": route_short_name,
                    "route": trip_headsign,
                    "stop_sequence": stop_time.stop_sequence,
                    'shape_dist_traveled': getattr(stop_time, 'shape_dist_traveled', 0),
                    "next_streets": next_streets,

                    "starting_code": starting_code,
                    "starting_name": starting_name,
                    "starting_time": starting_time,

                    "calling_time": stop_time.departure_time,
                    "calling_ssm": time_to_seconds(stop_time.departure_time),

                    "terminus_code": terminus_code,
                    "terminus_name": terminus_name,
                    "terminus_time": terminus_time,
                })

    # Sort each stop's arrivals by arrival time
    for stop_code in stop_arrivals:
        # Filter out entries with None arrival_seconds
        stop_arrivals[stop_code] = [
            item for item in stop_arrivals[stop_code] if item["calling_ssm"] is not None]
        stop_arrivals[stop_code].sort(key=lambda x: x["calling_ssm"])

    return stop_arrivals


def process_date(
    feed_dir: str,
    date: str,
    output_dir: str
) -> tuple[str, Dict[str, int]]:
    """
    Process a single date and write its stop JSON files.
    Returns summary data for index generation.
    """
    logger = get_logger(f"stop_report_{date}")
    try:
        logger.info(f"Starting stop report generation for date {date}")

        # Get all stop arrivals for the current date
        stop_arrivals = get_stop_arrivals(feed_dir, date)

        if not stop_arrivals:
            logger.warning(f"No stop arrivals found for date {date}")
            return date, {}

        # Write individual stop JSON files
        for stop_code, arrivals in stop_arrivals.items():
            write_stop_json(output_dir, date, stop_code, arrivals)

        # Create summary for index
        stop_summary = {stop_code: len(arrivals)
                        for stop_code, arrivals in stop_arrivals.items()}
        logger.info(f"Processed {len(stop_arrivals)} stops for date {date}")

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
        logger.error('No valid dates found in feed.')
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
