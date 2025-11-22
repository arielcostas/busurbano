"""
Report writers for various output formats (HTML, JSON).
Centralizes all write operations for different report types.
"""

import json
import os
from typing import Any, Dict, List

from src.logger import get_logger
from src.proto.stop_schedule_pb2 import Epsg25829, StopArrivals


def write_stop_protobuf(
    output_dir: str,
    date: str,
    stop_code: str,
    arrivals: List[Dict[str, Any]],
    stop_x: float,
    stop_y: float,
) -> None:
    """
    Write stop arrivals data to a Protobuf file.

    Args:
        output_dir: Base output directory
        date: Date string for the data
        stop_code: Stop code identifier
        stop_arrivals_proto: Serialized Protobuf data
    """
    logger = get_logger("report_writer")

    item = StopArrivals(
        stop_id=stop_code,
        location=Epsg25829(x=stop_x, y=stop_y),
        arrivals=[
            StopArrivals.ScheduledArrival(
                service_id=arrival["service_id"],
                trip_id=arrival["trip_id"],
                line=arrival["line"],
                route=arrival["route"],
                shape_id=arrival["shape_id"],
                shape_dist_traveled=arrival["shape_dist_traveled"],
                stop_sequence=arrival["stop_sequence"],
                next_streets=arrival["next_streets"],
                starting_code=arrival["starting_code"],
                starting_name=arrival["starting_name"],
                starting_time=arrival["starting_time"],
                calling_time=arrival["calling_time"],
                calling_ssm=arrival["calling_ssm"],
                terminus_code=arrival["terminus_code"],
                terminus_name=arrival["terminus_name"],
                terminus_time=arrival["terminus_time"],
                previous_trip_shape_id=arrival.get("previous_trip_shape_id", ""),
            )
            for arrival in arrivals
        ],
    )

    try:
        # Create the stops directory for this date
        date_dir = os.path.join(output_dir, date)
        os.makedirs(date_dir, exist_ok=True)

        # Create the Protobuf file
        file_path = os.path.join(date_dir, f"{stop_code}.pb")

        with open(file_path, "wb") as f:
            f.write(item.SerializeToString())

        logger.debug(f"Stop Protobuf written to: {file_path}")
    except Exception as e:
        logger.error(
            f"Error writing stop Protobuf to {output_dir}/stops/{date}/{stop_code}.pb: {e}"
        )
        raise


def write_stop_json(
    output_dir: str, date: str, stop_code: str, arrivals: List[Dict[str, Any]]
) -> None:
    """
    Write stop arrivals data to a JSON file.

    Args:
        output_dir: Base output directory
        date: Date string for the data
        stop_code: Stop code identifier
        arrivals: List of arrival dictionaries
        pretty: Whether to format JSON with indentation
    """
    logger = get_logger("report_writer")

    try:
        # Create the stops directory for this date
        date_dir = os.path.join(output_dir, date)
        os.makedirs(date_dir, exist_ok=True)

        # Create the JSON file
        file_path = os.path.join(date_dir, f"{stop_code}.json")

        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(arrivals, f, ensure_ascii=False)

        logger.debug(f"Stop JSON written to: {file_path}")
    except Exception as e:
        logger.error(
            f"Error writing stop JSON to {output_dir}/stops/{date}/{stop_code}.json: {e}"
        )
        raise


def write_index_json(
    output_dir: str,
    data: Dict[str, Any],
    filename: str = "index.json",
    pretty: bool = False,
) -> None:
    """
    Write index data to a JSON file.

    Args:
        output_dir: Directory where the JSON file should be written
        data: Dictionary containing the index data
        filename: Name of the JSON file (default: "index.json")
        pretty: Whether to format JSON with indentation
    """
    logger = get_logger("report_writer")

    try:
        # Create the output directory if it doesn't exist
        os.makedirs(output_dir, exist_ok=True)

        # Write the index.json file
        index_filepath = os.path.join(output_dir, filename)
        with open(index_filepath, "w", encoding="utf-8") as f:
            if pretty:
                json.dump(data, f, ensure_ascii=False, indent=2)
            else:
                json.dump(data, f, ensure_ascii=False, separators=(",", ":"))

        logger.info(f"Index JSON written to: {index_filepath}")
    except Exception as e:
        logger.error(f"Error writing index JSON to {output_dir}/{filename}: {e}")
        raise
