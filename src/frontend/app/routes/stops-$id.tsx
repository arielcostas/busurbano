import { Edit2, RefreshCw, Star } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router";
import { ErrorDisplay } from "~/components/ErrorDisplay";
import LineIcon from "~/components/LineIcon";
import { StopAlert } from "~/components/StopAlert";
import { StopMap } from "~/components/StopMapSheet";
import { ConsolidatedCirculationList } from "~/components/Stops/ConsolidatedCirculationList";
import { ConsolidatedCirculationListSkeleton } from "~/components/Stops/ConsolidatedCirculationListSkeleton";
import { type RegionId, getRegionConfig } from "~/data/RegionConfig";
import { useAutoRefresh } from "~/hooks/useAutoRefresh";
import { useApp } from "../AppContext";
import StopDataProvider, { type Stop } from "../data/StopDataProvider";
import "./stops-$id.css";

export interface ConsolidatedCirculation {
  line: string;
  route: string;
  schedule?: {
    running: boolean;
    minutes: number;
    serviceId: string;
    tripId: string;
  };
  realTime?: {
    minutes: number;
    distance: number;
  };
  currentPosition?: {
    latitude: number;
    longitude: number;
    orientationDegrees: number;
  };
}

interface ErrorInfo {
  type: "network" | "server" | "unknown";
  status?: number;
  message?: string;
}

const loadConsolidatedData = async (
  region: RegionId,
  stopId: string
): Promise<ConsolidatedCirculation[]> => {
  const regionConfig = getRegionConfig(region);
  const resp = await fetch(
    `${regionConfig.consolidatedCirculationsEndpoint}?stopId=${stopId}`,
    {
      headers: {
        Accept: "application/json",
      },
    }
  );

  if (!resp.ok) {
    throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
  }

  return await resp.json();
};

export default function Estimates() {
  const { t } = useTranslation();
  const params = useParams();
  const stopIdNum = parseInt(params.id ?? "");
  const [customName, setCustomName] = useState<string | undefined>(undefined);
  const [stopData, setStopData] = useState<Stop | undefined>(undefined);

  // Data state
  const [data, setData] = useState<ConsolidatedCirculation[] | null>(null);
  const [dataDate, setDataDate] = useState<Date | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState<ErrorInfo | null>(null);

  const [favourited, setFavourited] = useState(false);
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  const { region } = useApp();
  const regionConfig = getRegionConfig(region);

  const parseError = (error: any): ErrorInfo => {
    if (!navigator.onLine) {
      return { type: "network", message: "No internet connection" };
    }

    if (
      error.message?.includes("Failed to fetch") ||
      error.message?.includes("NetworkError")
    ) {
      return { type: "network" };
    }

    if (error.message?.includes("HTTP")) {
      const statusMatch = error.message.match(/HTTP (\d+):/);
      const status = statusMatch ? parseInt(statusMatch[1]) : undefined;
      return { type: "server", status };
    }

    return { type: "unknown", message: error.message };
  };

  const loadData = useCallback(async () => {
    try {
      setDataLoading(true);
      setDataError(null);

      const body = await loadConsolidatedData(region, params.id!);
      setData(body);
      setDataDate(new Date());

      // Load stop data from StopDataProvider
      const stop = await StopDataProvider.getStopById(region, stopIdNum);
      setStopData(stop);
      setCustomName(StopDataProvider.getCustomName(region, stopIdNum));
    } catch (error) {
      console.error("Error loading consolidated data:", error);
      setDataError(parseError(error));
      setData(null);
      setDataDate(null);
    } finally {
      setDataLoading(false);
    }
  }, [params.id, stopIdNum, region]);

  const refreshData = useCallback(async () => {
    await Promise.all([loadData()]);
  }, [loadData]);

  // Manual refresh function for pull-to-refresh and button
  const handleManualRefresh = useCallback(async () => {
    try {
      setIsManualRefreshing(true);
      // Only reload real-time estimates data, not timetable
      await refreshData();
    } finally {
      setIsManualRefreshing(false);
    }
  }, [refreshData]);

  // Auto-refresh estimates data every 30 seconds (only if not in error state)
  useAutoRefresh({
    onRefresh: refreshData,
    interval: 12000,
    enabled: !dataError,
  });

  useEffect(() => {
    // Initial load
    loadData();

    StopDataProvider.pushRecent(region, parseInt(params.id ?? ""));
    setFavourited(
      StopDataProvider.isFavourite(region, parseInt(params.id ?? ""))
    );
  }, [params.id, region, loadData]);

  const toggleFavourite = () => {
    if (favourited) {
      StopDataProvider.removeFavourite(region, stopIdNum);
      setFavourited(false);
    } else {
      StopDataProvider.addFavourite(region, stopIdNum);
      setFavourited(true);
    }
  };

  // Helper function to get the display name for the stop
  const getStopDisplayName = () => {
    if (customName) return customName;
    if (stopData?.name.intersect) return stopData.name.intersect;
    if (stopData?.name.original) return stopData.name.original;
    return `Parada ${stopIdNum}`;
  };

  const handleRename = () => {
    const current = getStopDisplayName();
    const input = window.prompt("Custom name for this stop:", current);
    if (input === null) return; // cancelled
    const trimmed = input.trim();
    if (trimmed === "") {
      StopDataProvider.removeCustomName(region, stopIdNum);
      setCustomName(undefined);
    } else {
      StopDataProvider.setCustomName(region, stopIdNum, trimmed);
      setCustomName(trimmed);
    }
  };

  return (
    <>
      <div className="page-container stops-page">
        <div className="stops-header">
          <h1 className="page-title">
            <Star
              className={`star-icon ${favourited ? "active" : ""}`}
              onClick={toggleFavourite}
            />
            <Edit2 className="edit-icon" onClick={handleRename} />
            {getStopDisplayName()}{" "}
            <span className="estimates-stop-id">({stopIdNum})</span>
          </h1>

          <button
            className="manual-refresh-button"
            onClick={handleManualRefresh}
            disabled={isManualRefreshing || dataLoading}
            title={t("estimates.reload", "Recargar estimaciones")}
          >
            <RefreshCw
              className={`refresh-icon ${isManualRefreshing ? "spinning" : ""}`}
            />
          </button>
        </div>

        {stopData && stopData.lines && stopData.lines.length > 0 && (
          <div className={`estimates-lines-container scrollable`}>
            {stopData.lines.map((line) => (
              <div key={line} className="estimates-line-icon">
                <LineIcon line={line} region={region} rounded />
              </div>
            ))}
          </div>
        )}

        {stopData && <StopAlert stop={stopData} />}

        <div className="experimental-notice">
          <strong>
            {t("estimates.experimental_feature", "Experimental feature")}
          </strong>
        </div>

        <div className="estimates-list-container">
          {dataLoading ? (
            <ConsolidatedCirculationListSkeleton />
          ) : dataError ? (
            <ErrorDisplay
              error={dataError}
              onRetry={loadData}
              title={t(
                "errors.estimates_title",
                "Error al cargar estimaciones"
              )}
            />
          ) : data ? (
            <ConsolidatedCirculationList
              data={data}
              dataDate={dataDate}
              regionConfig={regionConfig}
            />
          ) : null}
        </div>

        {stopData && (
          <StopMap
            stop={stopData}
            region={region}
            circulations={(data ?? []).map((c) => ({
              line: c.line,
              route: c.route,
              currentPosition: c.currentPosition,
            }))}
          />
        )}
      </div>
    </>
  );
}
