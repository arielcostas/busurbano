"""
Functions for handling GTFS trip data.
"""
import os
from src.logger import get_logger

logger = get_logger("trips")

class TripLine:
    """
    Class representing a trip line in the GTFS data.
    """
    def __init__(self, route_id: str, service_id: str, trip_id: str, headsign: str, direction_id: int, shape_id: str|None = None):
        self.route_id = route_id
        self.service_id = service_id
        self.trip_id = trip_id
        self.headsign = headsign
        self.direction_id = direction_id
        self.shape_id = shape_id
        self.route_short_name = ""
        self.route_color = ""

    def __str__(self):
        return f"TripLine({self.route_id=}, {self.service_id=}, {self.trip_id=}, {self.headsign=}, {self.direction_id=}, {self.shape_id=})"


TRIPS_BY_SERVICE_ID: dict[str, dict[str, list[TripLine]]] = {}


def get_trips_for_services(feed_dir: str, service_ids: list[str]) -> dict[str, list[TripLine]]:
    """
    Get trips for a list of service IDs based on the 'trips.txt' file.
    Uses caching to avoid reading and parsing the file multiple times.
    
    Args:
        feed_dir (str): Directory containing the GTFS feed files.
        service_ids (list[str]): List of service IDs to find trips for.
        
    Returns:
        dict[str, list[TripLine]]: Dictionary mapping service IDs to lists of trip objects.
    """
    # Check if we already have cached data for this feed directory
    if feed_dir in TRIPS_BY_SERVICE_ID:
        logger.debug(f"Using cached trips data for {feed_dir}")
        # Return only the trips for the requested service IDs
        return {service_id: TRIPS_BY_SERVICE_ID[feed_dir].get(service_id, []) 
                for service_id in service_ids}
    
    trips: dict[str, list[TripLine]] = {}

    try:
        with open(os.path.join(feed_dir, 'trips.txt'), 'r', encoding="utf-8") as trips_file:
            lines = trips_file.readlines()
            if len(lines) <= 1:
                logger.warning(
                    "trips.txt file is empty or has only header line, not processing.")
                return trips

            header = lines[0].strip().split(',')
            try:
                service_id_index = header.index('service_id')
                trip_id_index = header.index('trip_id')
                route_id_index = header.index('route_id')
                headsign_index = header.index('trip_headsign')
                direction_id_index = header.index('direction_id')
            except ValueError as e:
                logger.error(f"Required column not found in header: {e}")
                return trips

            # Check if shape_id column exists
            shape_id_index = None
            if 'shape_id' in header:
                shape_id_index = header.index('shape_id')
            else:
                logger.warning("shape_id column not found in trips.txt")

            # Initialize cache for this feed directory
            TRIPS_BY_SERVICE_ID[feed_dir] = {}
            
            for line in lines[1:]:
                parts = line.strip().split(',')
                if len(parts) < len(header):
                    logger.warning(
                        f"Skipping malformed line in trips.txt: {line.strip()}")
                    continue

                service_id = parts[service_id_index]
                trip_id = parts[trip_id_index]

                # Cache all trips, not just the ones requested
                if service_id not in TRIPS_BY_SERVICE_ID[feed_dir]:
                    TRIPS_BY_SERVICE_ID[feed_dir][service_id] = []

                # Get shape_id if available
                shape_id = None
                if shape_id_index is not None and shape_id_index < len(parts):
                    shape_id = parts[shape_id_index] if parts[shape_id_index] else None

                trip_line = TripLine(
                    route_id=parts[route_id_index],
                    service_id=service_id,
                    trip_id=trip_id,
                    headsign=parts[headsign_index],
                    direction_id=int(
                        parts[direction_id_index] if parts[direction_id_index] else -1),
                    shape_id=shape_id
                )
                
                TRIPS_BY_SERVICE_ID[feed_dir][service_id].append(trip_line)
                
                # Also build the result for the requested service IDs
                if service_id in service_ids:
                    if service_id not in trips:
                        trips[service_id] = []
                    trips[service_id].append(trip_line)
                    
    except FileNotFoundError:
        logger.warning("trips.txt file not found.")

    return trips
