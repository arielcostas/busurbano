"""
Common utilities for GTFS report generation.
"""

import csv
import os
from datetime import datetime, timedelta
from typing import List


def get_all_feed_dates(feed_dir: str) -> List[str]:
    """
    Returns all dates the feed is valid for, using calendar.txt if present, else calendar_dates.txt.
    """
    calendar_path = os.path.join(feed_dir, "calendar.txt")
    calendar_dates_path = os.path.join(feed_dir, "calendar_dates.txt")

    # Try calendar.txt first
    if os.path.exists(calendar_path):
        with open(calendar_path, encoding="utf-8") as f:
            reader = csv.DictReader(f)
            start_dates: List[str] = []
            end_dates: List[str] = []
            for row in reader:
                if row.get("start_date") and row.get("end_date"):
                    start_dates.append(row["start_date"])
                    end_dates.append(row["end_date"])
            if start_dates and end_dates:
                min_date = min(start_dates)
                max_date = max(end_dates)
                # Convert YYYYMMDD to YYYY-MM-DD
                start = datetime.strptime(min_date, "%Y%m%d")
                end = datetime.strptime(max_date, "%Y%m%d")
                result: List[str] = []
                while start <= end:
                    result.append(start.strftime("%Y-%m-%d"))
                    start += timedelta(days=1)
                return result
            else:
                # Return from today to 7 days ahead if no valid dates found
                today = datetime.now()
                return [(today + timedelta(days=i)).strftime("%Y-%m-%d") for i in range(8)]

    # Fallback: use calendar_dates.txt
    if os.path.exists(calendar_dates_path):
        with open(calendar_dates_path, encoding="utf-8") as f:
            reader = csv.DictReader(f)
            dates: set[str] = set()
            for row in reader:
                if row.get("exception_type") == "1" and row.get("date"):
                    # Convert YYYYMMDD to YYYY-MM-DD
                    d = row["date"]
                    dates.add(f"{d[:4]}-{d[4:6]}-{d[6:]}")
            return sorted(dates)

    return []


def time_to_seconds(time_str: str) -> int:
    """Convert HH:MM:SS to seconds since midnight."""
    parts = time_str.split(":")
    if len(parts) != 3:
        return 0
    hours, minutes, seconds = map(int, parts)
    return hours * 3600 + minutes * 60 + seconds
