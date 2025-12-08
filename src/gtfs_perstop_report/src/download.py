import os
import tempfile
import zipfile
import requests
import json
from typing import Optional, Tuple

from src.logger import get_logger

logger = get_logger("download")


def _get_metadata_path(output_dir: str) -> str:
    """Get the path to the metadata file for storing ETag and Last-Modified info."""
    return os.path.join(output_dir, ".gtfsmetadata")


def _load_metadata(output_dir: str) -> Optional[dict]:
    """Load existing metadata from the output directory."""
    metadata_path = _get_metadata_path(output_dir)
    if os.path.exists(metadata_path):
        try:
            with open(metadata_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError) as e:
            logger.warning(f"Failed to load metadata from {metadata_path}: {e}")
    return None


def _save_metadata(
    output_dir: str, etag: Optional[str], last_modified: Optional[str]
) -> None:
    """Save ETag and Last-Modified metadata to the output directory."""
    metadata_path = _get_metadata_path(output_dir)
    metadata = {"etag": etag, "last_modified": last_modified}

    # Ensure output directory exists
    os.makedirs(output_dir, exist_ok=True)

    try:
        with open(metadata_path, "w", encoding="utf-8") as f:
            json.dump(metadata, f, indent=2)
    except IOError as e:
        logger.warning(f"Failed to save metadata to {metadata_path}: {e}")


def _check_if_modified(
    feed_url: str, output_dir: str
) -> Tuple[bool, Optional[str], Optional[str]]:
    """
    Check if the feed has been modified using conditional headers.
    Returns (is_modified, etag, last_modified)
    """
    metadata = _load_metadata(output_dir)
    if not metadata:
        return True, None, None

    headers = {}
    if metadata.get("etag"):
        headers["If-None-Match"] = metadata["etag"]
    if metadata.get("last_modified"):
        headers["If-Modified-Since"] = metadata["last_modified"]

    if not headers:
        return True, None, None

    try:
        response = requests.head(feed_url, headers=headers)

        if response.status_code == 304:
            logger.info(
                "Feed has not been modified (304 Not Modified), skipping download"
            )
            return False, metadata.get("etag"), metadata.get("last_modified")
        elif response.status_code == 200:
            etag = response.headers.get("ETag")
            last_modified = response.headers.get("Last-Modified")
            return True, etag, last_modified
        else:
            logger.warning(
                f"Unexpected response status {response.status_code} when checking for modifications, proceeding with download"
            )
            return True, None, None
    except requests.RequestException as e:
        logger.warning(
            f"Failed to check if feed has been modified: {e}, proceeding with download"
        )
        return True, None, None


def download_feed_from_url(
    feed_url: str, output_dir: str = None, force_download: bool = False
) -> Optional[str]:
    """
    Download GTFS feed from URL.

    Args:
        feed_url: URL to download the GTFS feed from
        output_dir: Directory where reports will be written (used for metadata storage)
        force_download: If True, skip conditional download checks

    Returns:
        Path to the directory containing the extracted GTFS files, or None if download was skipped
    """

    # Check if we need to download the feed
    if not force_download and output_dir:
        is_modified, cached_etag, cached_last_modified = _check_if_modified(
            feed_url, output_dir
        )
        if not is_modified:
            logger.info("Feed has not been modified, skipping download")
            return None

    # Create a directory in the system temporary directory
    temp_dir = tempfile.mkdtemp(prefix="gtfs_vigo_")

    # Create a temporary zip file in the temporary directory
    zip_filename = os.path.join(temp_dir, "gtfs_vigo.zip")

    headers = {}
    response = requests.get(feed_url, headers=headers)

    if response.status_code != 200:
        raise Exception(f"Failed to download GTFS data: {response.status_code}")

    with open(zip_filename, "wb") as file:
        file.write(response.content)

    # Extract and save metadata if output_dir is provided
    if output_dir:
        etag = response.headers.get("ETag")
        last_modified = response.headers.get("Last-Modified")
        if etag or last_modified:
            _save_metadata(output_dir, etag, last_modified)

    # Extract the zip file
    with zipfile.ZipFile(zip_filename, "r") as zip_ref:
        zip_ref.extractall(temp_dir)

    # Clean up the downloaded zip file
    os.remove(zip_filename)

    logger.info(f"GTFS feed downloaded from {feed_url} and extracted to {temp_dir}")

    return temp_dir
