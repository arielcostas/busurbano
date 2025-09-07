import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import StopDataProvider, { type Stop } from "../data/StopDataProvider";
import StopItem from "../components/StopItem";
import Fuse from "fuse.js";
import "./stoplist.css";
import { useTranslation } from "react-i18next";

export default function StopList() {
  const { t } = useTranslation();
  const [data, setData] = useState<Stop[] | null>(null);
  const [searchResults, setSearchResults] = useState<Stop[] | null>(null);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  const randomPlaceholder = useMemo(
    () => t("stoplist.search_placeholder"),
    [t],
  );
  const fuse = useMemo(
    () => new Fuse(data || [], { threshold: 0.3, keys: ["name.original"] }),
    [data],
  );

  const loadStops = useCallback(async () => {
    const stops = await StopDataProvider.getStops();
    setData(stops);
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

  const favouritedStops = useMemo(() => {
    return data?.filter((stop) => stop.favourite) ?? [];
  }, [data]);

  const recentStops = useMemo(() => {
    // no recent items if data not loaded
    if (!data) return null;
    const recentIds = StopDataProvider.getRecent();
    if (recentIds.length === 0) return null;
    // map and filter out missing entries
    const stopsList = recentIds
      .map((id) => data.find((stop) => stop.stopId === id))
      .filter((s): s is Stop => Boolean(s));
    return stopsList.reverse();
  }, [data]);

  if (data === null) {
    return <h1 className="page-title">{t("common.loading")}</h1>;
  }

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

        {favouritedStops?.length === 0 && (
          <p className="message">
            {t(
              "stoplist.no_favourites",
              "Accede a una parada y márcala como favorita para verla aquí.",
            )}
          </p>
        )}

        <ul className="list">
          {favouritedStops
            ?.sort((a, b) => a.stopId - b.stopId)
            .map((stop: Stop) => <StopItem key={stop.stopId} stop={stop} />)}
        </ul>
      </div>

      {recentStops && recentStops.length > 0 && (
        <div className="list-container">
          <h2 className="page-subtitle">{t("stoplist.recents")}</h2>

          <ul className="list">
            {recentStops.map((stop: Stop) => (
              <StopItem key={stop.stopId} stop={stop} />
            ))}
          </ul>
        </div>
      )}

      <div className="list-container">
        <h2 className="page-subtitle">{t("stoplist.all_stops", "Paradas")}</h2>

        <ul className="list">
          {data
            ?.sort((a, b) => a.stopId - b.stopId)
            .map((stop: Stop) => <StopItem key={stop.stopId} stop={stop} />)}
        </ul>
      </div>
    </div>
  );
}
