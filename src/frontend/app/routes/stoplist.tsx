import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import StopDataProvider, { type Stop } from "../data/StopDataProvider";
import StopItem from "../components/StopItem";
import StopItemSkeleton from "../components/StopItemSkeleton";
import StopGallery from "../components/StopGallery";
import ServiceAlerts from "../components/ServiceAlerts";
import Fuse from "fuse.js";
import "./stoplist.css";
import { useTranslation } from "react-i18next";
import { useApp } from "../AppContext";
import { REGIONS } from "~/data/RegionConfig";

export default function StopList() {
  const { t } = useTranslation();
  const { region } = useApp();
  const [data, setData] = useState<Stop[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchResults, setSearchResults] = useState<Stop[] | null>(null);
  const [favouriteIds, setFavouriteIds] = useState<number[]>([]);
  const [recentIds, setRecentIds] = useState<number[]>([]);
  const [favouriteStops, setFavouriteStops] = useState<Stop[]>([]);
  const [recentStops, setRecentStops] = useState<Stop[]>([]);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  const randomPlaceholder = useMemo(
    () => t("stoplist.search_placeholder"),
    [t],
  );

  const fuse = useMemo(
    () =>
      new Fuse(data || [], {
        threshold: 0.3,
        keys: ["name.original", "name.intersect", "stopId"],
      }),
    [data],
  );

  const requestUserLocation = useCallback(() => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        console.warn("Unable to obtain user location", error);
      },
      {
        enableHighAccuracy: false,
        maximumAge: 5 * 60 * 1000,
      },
    );
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      return;
    }

    let permissionStatus: PermissionStatus | null = null;

    const handlePermissionChange = () => {
      if (permissionStatus?.state === "granted") {
        requestUserLocation();
      }
    };

    const checkPermission = async () => {
      try {
        if (navigator.permissions?.query) {
          permissionStatus = await navigator.permissions.query({
            name: "geolocation",
          });
          if (permissionStatus.state === "granted") {
            requestUserLocation();
          }
          permissionStatus.addEventListener("change", handlePermissionChange);
        } else {
          requestUserLocation();
        }
      } catch (error) {
        console.warn("Geolocation permission check failed", error);
        requestUserLocation();
      }
    };

    checkPermission();

    return () => {
      permissionStatus?.removeEventListener("change", handlePermissionChange);
    };
  }, [requestUserLocation]);

  // Sort stops by proximity when we know where the user is located.
  const sortedAllStops = useMemo(() => {
    if (!data) {
      return [] as Stop[];
    }

    if (!userLocation) {
      return [...data].sort((a, b) => a.stopId - b.stopId);
    }

    const toRadians = (value: number) => (value * Math.PI) / 180;
    const getDistance = (
      lat1: number,
      lon1: number,
      lat2: number,
      lon2: number,
    ) => {
      const R = 6371000; // meters
      const dLat = toRadians(lat2 - lat1);
      const dLon = toRadians(lon2 - lon1);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) *
          Math.cos(toRadians(lat2)) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

    return data
      .map((stop) => {
        if (
          typeof stop.latitude !== "number" ||
          typeof stop.longitude !== "number"
        ) {
          return { stop, distance: Number.POSITIVE_INFINITY };
        }

        const distance = getDistance(
          userLocation.latitude,
          userLocation.longitude,
          stop.latitude,
          stop.longitude,
        );

        return { stop, distance };
      })
      .sort((a, b) => {
        if (a.distance === b.distance) {
          return a.stop.stopId - b.stop.stopId;
        }
        return a.distance - b.distance;
      })
      .map(({ stop }) => stop);
  }, [data, userLocation]);

  // Load favourite and recent IDs immediately from localStorage
  useEffect(() => {
    setFavouriteIds(StopDataProvider.getFavouriteIds(region));
    setRecentIds(StopDataProvider.getRecent(region));
  }, [region]);

  // Load stops from network
  const loadStops = useCallback(async () => {
    try {
      setLoading(true);

      const stops = await StopDataProvider.loadStopsFromNetwork(region);

      // Add favourite flags to stops
      const favouriteStopsIds = StopDataProvider.getFavouriteIds(region);
      const stopsWithFavourites = stops.map((stop) => ({
        ...stop,
        favourite: favouriteStopsIds.includes(stop.stopId),
      }));

      setData(stopsWithFavourites);

      // Update favourite and recent stops with full data
      const favStops = stopsWithFavourites.filter((stop) =>
        favouriteStopsIds.includes(stop.stopId),
      );
      setFavouriteStops(favStops);

      const recIds = StopDataProvider.getRecent(region);
      const recStops = recIds
        .map((id) => stopsWithFavourites.find((stop) => stop.stopId === id))
        .filter(Boolean) as Stop[];
      setRecentStops(recStops.reverse());
    } catch (error) {
      console.error("Failed to load stops:", error);
    } finally {
      setLoading(false);
    }
  }, [region]);

  useEffect(() => {
    loadStops();
  }, [loadStops]);

  const handleStopSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const searchQuery = event.target.value || "";

    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    searchTimeout.current = setTimeout(() => {
      if (searchQuery.length === 0) {
        setSearchResults(null);
        return;
      }

      if (!data) {
        console.error("No data available for search");
        return;
      }

      // Check if search query is a number (stop code search)
      const isNumericSearch = /^\d+$/.test(searchQuery.trim());

      let items: Stop[];
      if (isNumericSearch) {
        // Direct match for stop codes
        const stopId = parseInt(searchQuery.trim(), 10);
        const exactMatch = data.filter((stop) => stop.stopId === stopId);
        if (exactMatch.length > 0) {
          items = exactMatch;
        } else {
          // Fuzzy search if no exact match
          const results = fuse.search(searchQuery);
          items = results.map((result) => result.item);
        }
      } else {
        // Text search using Fuse.js
        const results = fuse.search(searchQuery);
        items = results.map((result) => result.item);
      }

      setSearchResults(items);
    }, 300);
  };

  return (
    <div className="page-container stoplist-page">
      <h1 className="page-title">BusUrbano - {REGIONS[region].name}</h1>

      <form className="search-form">
        <div className="form-group">
          <label className="form-label" htmlFor="stopName">
            {t("stoplist.search_label", "Buscar paradas")}
          </label>
          <input
            className="form-input"
            type="text"
            placeholder={randomPlaceholder}
            id="stopName"
            onChange={handleStopSearch}
          />
        </div>
      </form>

      {searchResults && searchResults.length > 0 && (
        <div className="list-container">
          <h2 className="page-subtitle">
            {t("stoplist.search_results", "Resultados de la búsqueda")}
          </h2>
          <ul className="list">
            {searchResults.map((stop: Stop) => (
              <StopItem key={stop.stopId} stop={stop} />
            ))}
          </ul>
        </div>
      )}

      {!loading && (
        <StopGallery
          stops={recentStops.slice(0, 5)}
          title={t("stoplist.recents")}
        />
      )}

      {!loading && (
        <StopGallery
          stops={favouriteStops.sort((a, b) => a.stopId - b.stopId)}
          title={t("stoplist.favourites")}
          emptyMessage={t("stoplist.no_favourites")}
        />
      )}

      <ServiceAlerts />

      <div className="list-container">
        <h2 className="page-subtitle">
          {userLocation
            ? t("stoplist.nearby_stops", "Nearby stops")
            : t("stoplist.all_stops", "Paradas")}
        </h2>

        <ul className="list">
          {loading && (
            <>
              {Array.from({ length: 6 }, (_, index) => (
                <StopItemSkeleton key={`skeleton-${index}`} />
              ))}
            </>
          )}
          {!loading && data
            ? (userLocation ? sortedAllStops.slice(0, 6) : sortedAllStops).map(
                (stop) => <StopItem key={stop.stopId} stop={stop} />,
              )
            : null}
        </ul>
      </div>
    </div>
  );
}
