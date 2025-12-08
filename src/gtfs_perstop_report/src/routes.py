"""
Module for loading and querying GTFS routes data.
"""

import os
import csv
from src.logger import get_logger

logger = get_logger("routes")


def load_routes(feed_dir: str) -> dict[str, dict[str, str]]:
    """
    Load routes data from the GTFS feed.

    Returns:
        dict[str, dict[str, str]]: A dictionary where keys are route IDs and values are dictionaries
              containing route_short_name and route_color.
    """
    routes: dict[str, dict[str, str]] = {}
    routes_file_path = os.path.join(feed_dir, "routes.txt")

    try:
        with open(routes_file_path, "r", encoding="utf-8") as routes_file:
            reader = csv.DictReader(routes_file)
            header = reader.fieldnames or []
            if "route_color" not in header:
                logger.warning(
                    "Column 'route_color' not found in routes.txt. Defaulting to black (#000000)."
                )

            for row in reader:
                route_id = row["route_id"]
                if "route_color" in row and row["route_color"]:
                    route_color = row["route_color"]
                else:
                    route_color = "000000"
                routes[route_id] = {
                    "route_short_name": row["route_short_name"],
                    "route_color": route_color,
                }
    except FileNotFoundError:
        raise FileNotFoundError(f"Routes file not found at {routes_file_path}")
    except KeyError as e:
        raise KeyError(f"Missing required column in routes file: {e}")

    return routes
