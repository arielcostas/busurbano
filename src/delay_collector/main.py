import os
import sys
from datetime import datetime
from time import sleep, time
from zoneinfo import ZoneInfo
import logging
from pathlib import Path

import requests

from database import insert_observations


STOP_CODES = [
    14227,  # (Torrecedeira 86)
    8460,  # (Torrecedeira 105)
    20206,  # (Marqués Valladares ft. 19)
    14264,  # (Urzáiz-Príncipe)
    8770,  # (Urzáiz, 13)
    5610,  # (Gran Vía, 12)
    5660,  # (Gran Vía, 19)
    6940,  # (Praza América 3)
    2780,  # (Camelias, 135)
    8630,  # (Travesía 7)
    8610,  # (Travesía 8)
    5410,  # (Fragoso, 12)
    1360,  # (Castrelos, 16)
    8040,  # (Sanjurjo Badía, 167)
    14132,  # (Sanjurjo Badía, 252)
]

FREQUENCY_SECONDS = int(os.getenv("FREQUENCY_SECONDS", "30"))
SERVICE_START_HOUR = int(os.getenv("SERVICE_START_HOUR", "7"))  # 7 AM
SERVICE_START_MINUTE = int(os.getenv("SERVICE_START_MINUTE", "00"))  # 7 AM
SERVICE_END_HOUR = int(os.getenv("SERVICE_END_HOUR", "23"))  # 11 PM
SERVICE_END_MINUTE = int(os.getenv("SERVICE_END_MINUTE", "00"))  # 11:30 PM
SERVICE_TIMEZONE = os.getenv("SERVICE_TIMEZONE", "Europe/Madrid")


def setup_logging():
    """Configure logging for daemon operation."""
    # Configure logging to both file and console
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s',
        handlers=[
            logging.StreamHandler(sys.stdout)
        ]
    )
    return logging.getLogger(__name__)


def is_within_service_hours() -> bool:
    """Check if current time is within configured service hours (Madrid time)."""
    tz = ZoneInfo(SERVICE_TIMEZONE)
    now = datetime.now(tz)

    current_hour = now.hour
    current_minute = now.minute

    # Check if before start time
    if current_hour < SERVICE_START_HOUR:
        return False
    if current_hour == SERVICE_START_HOUR and current_minute < SERVICE_START_MINUTE:
        return False

    # Check if after end time
    if current_hour > SERVICE_END_HOUR:
        return False
    if current_hour == SERVICE_END_HOUR and current_minute >= SERVICE_END_MINUTE:
        return False

    return True


def wait_until_service_hours(logger):
    """Wait until service hours begin."""
    tz = ZoneInfo(SERVICE_TIMEZONE)

    while not is_within_service_hours():
        now = datetime.now(tz)
        logger.info(
            f"Outside service hours (current time: {now.strftime('%H:%M %Z')}). Waiting...")
        # Check every 5 minutes
        sleep(300)


def download_consolidated_data(stop_code: int) -> list[dict]:
    URL = f"https://busurbano.costas.dev/api/vigo/GetConsolidatedCirculations?stopId={stop_code}"

    response = requests.get(URL)
    if response.status_code == 200:
        return response.json()
    else:
        return []


def get_consolidated_data(stop_code: int):
    raw_data = download_consolidated_data(stop_code)

    processed_items = []
    for item in raw_data:
        line = item.get("line")
        route = item.get("route")
        schedule = item.get("schedule", None)
        real_time = item.get("realTime", None)

        # If either is missing, skip this item
        if schedule is None or real_time is None:
            continue

        processed_items.append(
            {
                "line": line,
                "route": route,
                "service_id": schedule.get("serviceId"),
                "trip_id": schedule.get("tripId"),
                "running": schedule.get("running", False),
                "scheduled_minutes": schedule.get("minutes"),
                "real_time_minutes": real_time.get("minutes"),
            }
        )

    return processed_items


def main():
    """Main collection loop that continuously gathers and stores delay data."""
    # Setup logging
    logger = setup_logging()

    # Log system time on startup
    tz = ZoneInfo(SERVICE_TIMEZONE)
    system_time = datetime.now(tz)
    logger.info(f"=== Delay Collector Starting ===")
    logger.info(f"System time: {system_time.strftime('%Y-%m-%d %H:%M:%S %Z')}")
    logger.info(
        f"Database: {os.getenv('DB_HOST', 'localhost')}:{os.getenv('DB_PORT', '5432')}/{os.getenv('DB_NAME', 'busurbano')}")

    # Calculate spacing between requests to evenly distribute them
    # We want to complete all stops every FREQUENCY_SECONDS, so space them evenly
    request_interval = FREQUENCY_SECONDS / len(STOP_CODES)

    logger.info(f"Monitoring {len(STOP_CODES)} stops")
    logger.info(f"Collection cycle: {FREQUENCY_SECONDS} seconds (all stops)")
    logger.info(
        f"Request interval: {request_interval:.2f} seconds (between stops)")
    logger.info(
        f"Service hours: {SERVICE_START_HOUR}:00 - {SERVICE_END_HOUR}:{SERVICE_END_MINUTE:02d} {SERVICE_TIMEZONE}")
    logger.info("Press Ctrl+C to stop\n")

    total_records = 0

    try:
        while True:
            # Check if within service hours
            if not is_within_service_hours():
                tz = ZoneInfo(SERVICE_TIMEZONE)
                now = datetime.now(tz)
                logger.info(
                    f"Outside service hours (current: {now.strftime('%H:%M %Z')}). Pausing collection.")
                logger.info(f"Total records collected today: {total_records}")

                # Wait until service hours resume
                wait_until_service_hours(logger)
                logger.info("Service hours resumed. Resuming collection...")
                # Reset daily counter
                total_records = 0
                continue

            cycle_start = time()

            # Collect from each stop, evenly spaced
            for stop_code in STOP_CODES:
                request_start = time()

                try:
                    # Capture the exact time of observation
                    observed_at = datetime.now(ZoneInfo('UTC'))

                    # Fetch and process data
                    data = get_consolidated_data(stop_code)

                    # Store in database
                    if data:
                        records_inserted = insert_observations(
                            data, stop_code, observed_at)
                        total_records += records_inserted
                        logger.info(
                            f"Stop {stop_code}: {records_inserted} observations (Total today: {total_records})")
                    else:
                        logger.debug(f"Stop {stop_code}: No observations")

                except Exception as e:
                    logger.error(f"Error processing stop {stop_code}: {e}")

                # Sleep to maintain even spacing between requests
                request_elapsed = time() - request_start
                sleep_time = request_interval - request_elapsed
                if sleep_time > 0:
                    sleep(sleep_time)

            # After completing all stops, wait if we finished early to maintain the cycle time
            cycle_elapsed = time() - cycle_start
            remaining_time = FREQUENCY_SECONDS - cycle_elapsed
            if remaining_time > 0:
                logger.debug(
                    f"Cycle completed in {cycle_elapsed:.1f}s, waiting {remaining_time:.1f}s")
                sleep(remaining_time)

    except KeyboardInterrupt:
        logger.info("\n=== Collection stopped by user ===")
        logger.info(f"Total records collected: {total_records}")
        sys.exit(0)


if __name__ == "__main__":
    main()
