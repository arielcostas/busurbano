import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import StopDataProvider, { type Stop } from "../data/StopDataProvider";
import StopItem from "../components/StopItem";
import StopItemSkeleton from "../components/StopItemSkeleton";
import Fuse from "fuse.js";
import "./stoplist.css";
import { useTranslation } from "react-i18next";

export default function StopList() {
  const { t } = useTranslation();
  const [data, setData] = useState<Stop[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchResults, setSearchResults] = useState<Stop[] | null>(null);
  const [favouriteIds, setFavouriteIds] = useState<number[]>([]);
  const [recentIds, setRecentIds] = useState<number[]>([]);
  const [favouriteStops, setFavouriteStops] = useState<Stop[]>([]);
  const [recentStops, setRecentStops] = useState<Stop[]>([]);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  const randomPlaceholder = useMemo(
    () => t("stoplist.search_placeholder"),
    [t],
  );

  const fuse = useMemo(
    () => new Fuse(data || [], { threshold: 0.3, keys: ["name.original"] }),
    [data],
  );

  // Load favourite and recent IDs immediately from localStorage
  useEffect(() => {
    setFavouriteIds(StopDataProvider.getFavouriteIds());
    setRecentIds(StopDataProvider.getRecent());
  }, []);

  // Load stops from network
  const loadStops = useCallback(async () => {
    try {
      setLoading(true);

      const stops = await StopDataProvider.loadStopsFromNetwork();

      // Add favourite flags to stops
      const favouriteStopsIds = StopDataProvider.getFavouriteIds();
      const stopsWithFavourites = stops.map(stop => ({
        ...stop,
        favourite: favouriteStopsIds.includes(stop.stopId)
      }));

      setData(stopsWithFavourites);

      // Update favourite and recent stops with full data
      const favStops = stopsWithFavourites.filter(stop =>
        favouriteStopsIds.includes(stop.stopId)
      );
      setFavouriteStops(favStops);

      const recIds = StopDataProvider.getRecent();
      const recStops = recIds
        .map(id => stopsWithFavourites.find(stop => stop.stopId === id))
        .filter(Boolean) as Stop[];
      setRecentStops(recStops.reverse());

    } catch (error) {
      console.error("Failed to load stops:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStops();
  }, [loadStops]);

  const handleStopSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const stopName = event.target.value || "";

    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    searchTimeout.current = setTimeout(() => {
      if (stopName.length === 0) {
        setSearchResults(null);
        return;
      }

      if (!data) {
        console.error("No data available for search");
        return;
      }

      const results = fuse.search(stopName);
      const items = results.map((result) => result.item);
      setSearchResults(items);
    }, 300);
  };

  return (
    <div className="page-container stoplist-page">
      <h1 className="page-title">UrbanoVigo Web</h1>

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

      <div className="list-container">
        <h2 className="page-subtitle">{t("stoplist.favourites")}</h2>

        {favouriteIds.length === 0 && (
          <p className="message">
            {t(
              "stoplist.no_favourites",
              "Accede a una parada y márcala como favorita para verla aquí.",
            )}
          </p>
        )}

        <ul className="list">
          {loading && favouriteIds.length > 0 &&
            favouriteIds.map((id) => (
              <StopItemSkeleton key={id} showId={true} stopId={id} />
            ))
          }
          {!loading && favouriteStops
            .sort((a, b) => a.stopId - b.stopId)
            .map((stop) => <StopItem key={stop.stopId} stop={stop} />)}
        </ul>
      </div>

      {(recentIds.length > 0 || (!loading && recentStops.length > 0)) && (
        <div className="list-container">
          <h2 className="page-subtitle">{t("stoplist.recents")}</h2>

          <ul className="list">
            {loading && recentIds.length > 0 &&
              recentIds.map((id) => (
                <StopItemSkeleton key={id} showId={true} stopId={id} />
              ))
            }
            {!loading && recentStops.map((stop) => (
              <StopItem key={stop.stopId} stop={stop} />
            ))}
          </ul>
        </div>
      )}

      <div className="list-container">
        <h2 className="page-subtitle">{t("stoplist.all_stops", "Paradas")}</h2>

        <ul className="list">
          {loading && (
            <>
              {Array.from({ length: 8 }, (_, index) => (
                <StopItemSkeleton key={`skeleton-${index}`} />
              ))}
            </>
          )}
          {!loading && data
            ?.sort((a, b) => a.stopId - b.stopId)
            .map((stop) => <StopItem key={stop.stopId} stop={stop} />)}
        </ul>
      </div>
    </div>
  );
}
