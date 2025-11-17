"""Database module for storing delay observations."""

import os
from datetime import datetime
from typing import List, Dict

import psycopg2
from psycopg2.extras import execute_values


def get_connection():
    """Get a PostgreSQL database connection."""
    conn = psycopg2.connect(
        host=os.getenv("DB_HOST", "localhost"),
        port=int(os.getenv("DB_PORT", "5432")),
        database=os.getenv("DB_NAME", "busurbano"),
        user=os.getenv("DB_USER", "postgres"),
        password=os.getenv("DB_PASSWORD", "")
    )
    return conn


def insert_observations(
    observations: List[Dict],
    stop_code: int,
    observed_at: datetime
) -> int:
    """
    Insert delay observations into the database.

    Args:
        observations: List of observation dicts with keys:
            line, route, service_id, trip_id, running, scheduled_minutes, real_time_minutes
        stop_code: The stop code where observations were made
        observed_at: The datetime when observations were collected

    Returns:
        Number of records inserted
    """
    if not observations:
        return 0

    conn = get_connection()
    try:
        cursor = conn.cursor()

        insert_sql = """
            INSERT INTO delay_observations (
                observed_at,
                stop_code,
                line,
                route,
                service_id,
                trip_id,
                running,
                scheduled_minutes,
                real_time_minutes
            ) VALUES %s
        """

        records = [
            (
                observed_at,
                stop_code,
                obs["line"],
                obs["route"],
                obs["service_id"],
                obs["trip_id"],
                obs["running"],
                obs["scheduled_minutes"],
                obs["real_time_minutes"],
            )
            for obs in observations
        ]

        execute_values(cursor, insert_sql, records)
        conn.commit()
        return len(records)
    finally:
        cursor.close()
        conn.close()


def get_statistics() -> Dict:
    """Get basic statistics about the collected data."""
    conn = get_connection()
    cursor = conn.cursor()
    try:
        # Total observations
        cursor.execute("SELECT COUNT(*) as total FROM delay_observations")
        result = cursor.fetchone()
        total = result[0] if result else 0

        # Date range
        cursor.execute(
            """
            SELECT
                MIN(observed_at) as first_observation,
                MAX(observed_at) as last_observation
            FROM delay_observations
            """
        )
        date_range = cursor.fetchone()

        # Unique stops and lines
        cursor.execute(
            """
            SELECT
                COUNT(DISTINCT stop_code) as unique_stops,
                COUNT(DISTINCT line) as unique_lines
            FROM delay_observations
            """
        )
        unique_counts = cursor.fetchone()

        return {
            "total_observations": total,
            "first_observation": str(date_range[0]) if date_range and date_range[0] else None,
            "last_observation": str(date_range[1]) if date_range and date_range[1] else None,
            "unique_stops": unique_counts[0] if unique_counts else 0,
            "unique_lines": unique_counts[1] if unique_counts else 0,
        }
    finally:
        cursor.close()
        conn.close()
