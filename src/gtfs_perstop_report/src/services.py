import os
import datetime
from src.logger import get_logger

logger = get_logger("services")


def get_active_services(feed_dir: str, date: str) -> list[str]:
    """
    Get active services for a given date based on the 'calendar.txt' and 'calendar_dates.txt' files.

    Args:
        date (str): Date in 'YYYY-MM-DD' format.

    Returns:
        list[str]: List of active service IDs for the given date.

    Raises:
        ValueError: If the date format is incorrect.
    """
    search_date = date.replace("-", "").replace(":", "").replace("/", "")
    weekday = datetime.datetime.strptime(date, "%Y-%m-%d").weekday()
    active_services: list[str] = []

    try:
        with open(
            os.path.join(feed_dir, "calendar.txt"), "r", encoding="utf-8"
        ) as calendar_file:
            lines = calendar_file.readlines()
            if len(lines) > 1:
                # First parse the header, get each column's index
                header = lines[0].strip().split(",")
                try:
                    service_id_index = header.index("service_id")
                    monday_index = header.index("monday")
                    tuesday_index = header.index("tuesday")
                    wednesday_index = header.index("wednesday")
                    thursday_index = header.index("thursday")
                    friday_index = header.index("friday")
                    saturday_index = header.index("saturday")
                    sunday_index = header.index("sunday")
                    start_date_index = header.index("start_date")
                    end_date_index = header.index("end_date")
                except ValueError as e:
                    logger.error(f"Required column not found in header: {e}")
                    return active_services
                # Now read the rest of the file, find all services where the day of the week matches
                weekday_columns = {
                    0: monday_index,
                    1: tuesday_index,
                    2: wednesday_index,
                    3: thursday_index,
                    4: friday_index,
                    5: saturday_index,
                    6: sunday_index,
                }

                for idx, line in enumerate(lines[1:], 1):
                    parts = line.strip().split(",")
                    if len(parts) < len(header):
                        logger.warning(
                            f"Skipping malformed line in calendar.txt line {idx + 1}: {line.strip()}"
                        )
                        continue

                    service_id = parts[service_id_index]
                    day_value = parts[weekday_columns[weekday]]
                    start_date = parts[start_date_index]
                    end_date = parts[end_date_index]

                    # Check if day of week is active AND date is within the service range
                    if day_value == "1" and start_date <= search_date <= end_date:
                        active_services.append(service_id)
    except FileNotFoundError:
        logger.warning("calendar.txt file not found.")

    try:
        with open(
            os.path.join(feed_dir, "calendar_dates.txt"), "r", encoding="utf-8"
        ) as calendar_dates_file:
            lines = calendar_dates_file.readlines()
            if len(lines) <= 1:
                logger.warning(
                    "calendar_dates.txt file is empty or has only header line, not processing."
                )
                return active_services

            header = lines[0].strip().split(",")
            try:
                service_id_index = header.index("service_id")
                date_index = header.index("date")
                exception_type_index = header.index("exception_type")
            except ValueError as e:
                logger.error(f"Required column not found in header: {e}")
                return active_services

            # Now read the rest of the file, find all services where 'date' matches the search_date
            # Start from 1 to skip header
            for idx, line in enumerate(lines[1:], 1):
                parts = line.strip().split(",")
                if len(parts) < len(header):
                    logger.warning(
                        f"Skipping malformed line in calendar_dates.txt line {idx + 1}: {line.strip()}"
                    )
                    continue

                service_id = parts[service_id_index]
                date_value = parts[date_index]
                exception_type = parts[exception_type_index]

                if date_value == search_date and exception_type == "1":
                    active_services.append(service_id)

                if date_value == search_date and exception_type == "2":
                    if service_id in active_services:
                        active_services.remove(service_id)
    except FileNotFoundError:
        logger.warning("calendar_dates.txt file not found.")

    return active_services
