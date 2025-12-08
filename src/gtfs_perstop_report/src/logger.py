"""
Logging configuration for the GTFS application.
"""

import logging
from colorama import init, Fore, Style

# Initialize Colorama (required on Windows)
init(autoreset=True)


class ColorFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord):
        # Base format
        log_format = "%(asctime)s | %(levelname)-8s | %(name)s | %(funcName)s:%(lineno)d | %(message)s"

        # Apply colors based on log level
        if record.levelno == logging.DEBUG:
            prefix = Style.DIM + Fore.WHITE  # "Dark grey"
        elif record.levelno == logging.INFO:
            prefix = Fore.CYAN
        elif record.levelno == logging.WARNING:
            prefix = Fore.YELLOW
        elif record.levelno == logging.ERROR:
            prefix = Fore.RED
        elif record.levelno == logging.CRITICAL:
            prefix = Style.BRIGHT + Fore.RED
        else:
            prefix = ""

        # Add color to the entire line
        formatter = logging.Formatter(
            prefix + log_format + Style.RESET_ALL, "%Y-%m-%d %H:%M:%S"
        )
        return formatter.format(record)


def get_logger(name: str) -> logging.Logger:
    """
    Create and return a logger with the given name.

    Args:
        name (str): The name of the logger.

    Returns:
        logging.Logger: Configured logger instance.
    """
    logger = logging.getLogger(name)
    logger.setLevel(logging.INFO)

    # Only add handler if it doesn't already have one
    if not logger.handlers:
        console_handler = logging.StreamHandler()
        console_handler.setLevel(logging.DEBUG)
        console_handler.setFormatter(ColorFormatter())
        logger.addHandler(console_handler)

    return logger
