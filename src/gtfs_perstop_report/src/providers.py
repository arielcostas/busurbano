"""
Provider-specific configuration for different GTFS feed formats.
"""

from typing import Protocol, Optional
from src.street_name import get_street_name


class FeedProvider(Protocol):
    """Protocol defining provider-specific behavior for GTFS feeds."""

    @staticmethod
    def format_service_id(service_id: str) -> str:
        """Format service_id for output."""
        ...

    @staticmethod
    def format_trip_id(trip_id: str) -> str:
        """Format trip_id for output."""
        ...

    @staticmethod
    def format_route(route: str, terminus_name: str) -> str:
        """Format route/headsign, potentially using terminus name as fallback."""
        ...

    @staticmethod
    def extract_street_name(stop_name: str) -> str:
        """Extract street name from stop name, or return full name."""
        ...


class VitrasaProvider:
    """Provider configuration for Vitrasa (Vigo bus system)."""

    @staticmethod
    def format_service_id(service_id: str) -> str:
        """Extract middle part from underscore-separated service_id."""
        parts = service_id.split("_")
        return parts[1] if len(parts) >= 2 else service_id

    @staticmethod
    def format_trip_id(trip_id: str) -> str:
        """Extract middle parts from underscore-separated trip_id."""
        parts = trip_id.split("_")
        return "_".join(parts[1:3]) if len(parts) >= 3 else trip_id

    @staticmethod
    def format_route(route: str, terminus_name: str) -> str:
        """Return route as-is for Vitrasa."""
        return route

    @staticmethod
    def extract_street_name(stop_name: str) -> str:
        """Extract street name from stop name using standard logic."""
        return get_street_name(stop_name) or ""


class RenfeProvider:
    """Provider configuration for Renfe (Spanish rail system)."""

    @staticmethod
    def format_service_id(service_id: str) -> str:
        """Use full service_id for Renfe (no underscores)."""
        return service_id

    @staticmethod
    def format_trip_id(trip_id: str) -> str:
        """Use full trip_id for Renfe (no underscores)."""
        return trip_id

    @staticmethod
    def format_route(route: str, terminus_name: str) -> str:
        """Use terminus name as route if route is empty."""
        val = route if route else terminus_name
        return val.replace("NY", "Ñ").replace("ny", "ñ")

    @staticmethod
    def extract_street_name(stop_name: str) -> str:
        """Preserve full stop name for train stations."""
        return stop_name.replace("NY", "Ñ").replace("ny", "ñ")


class DefaultProvider:
    """Default provider configuration for generic GTFS feeds."""

    @staticmethod
    def format_service_id(service_id: str) -> str:
        """Try to extract from underscores, fallback to full ID."""
        parts = service_id.split("_")
        return parts[1] if len(parts) >= 2 else service_id

    @staticmethod
    def format_trip_id(trip_id: str) -> str:
        """Try to extract from underscores, fallback to full ID."""
        parts = trip_id.split("_")
        return "_".join(parts[1:3]) if len(parts) >= 3 else trip_id

    @staticmethod
    def format_route(route: str, terminus_name: str) -> str:
        """Use terminus name as route if route is empty."""
        return route if route else terminus_name

    @staticmethod
    def extract_street_name(stop_name: str) -> str:
        """Extract street name from stop name using standard logic."""
        return get_street_name(stop_name) or ""


# Provider registry
PROVIDERS = {
    "vitrasa": VitrasaProvider,
    "renfe": RenfeProvider,
    "default": DefaultProvider,
}


def get_provider(provider_name: str) -> type[FeedProvider]:
    """
    Get provider configuration by name.

    Args:
        provider_name: Name of the provider (case-insensitive)

    Returns:
        Provider class with configuration methods

    Raises:
        ValueError: If provider name is not recognized
    """
    provider_name_lower = provider_name.lower()
    if provider_name_lower not in PROVIDERS:
        raise ValueError(
            f"Unknown provider: {provider_name}. "
            f"Available providers: {', '.join(PROVIDERS.keys())}"
        )
    return PROVIDERS[provider_name_lower]
