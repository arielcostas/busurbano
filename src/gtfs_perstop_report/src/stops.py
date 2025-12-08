import csv
import os
from dataclasses import dataclass
from typing import Dict, Optional

from pyproj import Transformer

from src.logger import get_logger

logger = get_logger("stops")


@dataclass
class Stop:
    stop_id: str
    stop_code: Optional[str]
    stop_name: Optional[str]
    stop_lat: Optional[float]
    stop_lon: Optional[float]

    stop_25829_x: Optional[float] = None
    stop_25829_y: Optional[float] = None


CACHED_STOPS: dict[str, dict[str, Stop]] = {}
CACHED_BY_CODE: dict[str, dict[str, Stop]] = {}


def get_all_stops_by_code(feed_dir: str) -> Dict[str, Stop]:
    if feed_dir in CACHED_BY_CODE:
        return CACHED_BY_CODE[feed_dir]

    transformer = Transformer.from_crs(4326, 25829, always_xy=True)

    stops_by_code: Dict[str, Stop] = {}
    all_stops = get_all_stops(feed_dir)

    for stop in all_stops.values():
        stop_25829_x, stop_25829_y = transformer.transform(
            stop.stop_lon, stop.stop_lat
        )
        stop.stop_25829_x = stop_25829_x
        stop.stop_25829_y = stop_25829_y

        if stop.stop_code:
            stops_by_code[get_numeric_code(stop.stop_code)] = stop
        else:
            stops_by_code[stop.stop_id] = stop

    CACHED_BY_CODE[feed_dir] = stops_by_code

    return stops_by_code


def get_all_stops(feed_dir: str) -> Dict[str, Stop]:
    if feed_dir in CACHED_STOPS:
        return CACHED_STOPS[feed_dir]

    stops: Dict[str, Stop] = {}
    file_path = os.path.join(feed_dir, "stops.txt")

    try:
        with open(file_path, "r", encoding="utf-8", newline="") as f:
            reader = csv.DictReader(f, quotechar='"', delimiter=",")
            for row_num, row in enumerate(reader, start=2):
                try:
                    stop = Stop(
                        stop_id=row["stop_id"],
                        stop_code=row.get("stop_code"),
                        stop_name=row["stop_name"].strip()
                        if row.get("stop_name", "").strip()
                        else row.get("stop_desc"),
                        stop_lat=float(row["stop_lat"])
                        if row.get("stop_lat")
                        else None,
                        stop_lon=float(row["stop_lon"])
                        if row.get("stop_lon")
                        else None,
                    )
                    stops[stop.stop_id] = stop
                except Exception as e:
                    logger.warning(
                        f"Error parsing stops.txt line {row_num}: {e} - line data: {row}"
                    )

    except FileNotFoundError:
        logger.error(f"File not found: {file_path}")
    except Exception as e:
        logger.error(f"Error reading stops.txt: {e}")

    CACHED_STOPS[feed_dir] = stops

    return stops


def get_numeric_code(stop_code: str | None) -> str:
    if not stop_code:
        return ""
    numeric_code = "".join(c for c in stop_code if c.isdigit())
    return str(int(numeric_code)) if numeric_code else ""
