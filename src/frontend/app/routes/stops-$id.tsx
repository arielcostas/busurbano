import { Edit2, RefreshCw, Star } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router";
import { ErrorDisplay } from "~/components/ErrorDisplay";
import LineIcon from "~/components/LineIcon";
import { PullToRefresh } from "~/components/PullToRefresh";
import { StopAlert } from "~/components/StopAlert";
import { StopMapModal } from "~/components/StopMapModal";
import { ConsolidatedCirculationList } from "~/components/Stops/ConsolidatedCirculationList";
import { ConsolidatedCirculationListSkeleton } from "~/components/Stops/ConsolidatedCirculationListSkeleton";
import { REGION_DATA } from "~/config/RegionConfig";
import { usePageTitle } from "~/contexts/PageTitleContext";
import { useAutoRefresh } from "~/hooks/useAutoRefresh";
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
    shapeId?: string;
  };
  realTime?: {
    minutes: number;
    distance: number;
  };
  currentPosition?: {
    latitude: number;
    longitude: number;
    orientationDegrees: number;
    shapeIndex?: number;
  };
  isPreviousTrip?: boolean;
  previousTripShapeId?: string;
}

export const getCirculationId = (c: ConsolidatedCirculation): string => {
  if (c.schedule?.tripId) {
    return `trip:${c.schedule.tripId}`;
  }
  return `rt:${c.line}:${c.route}:${c.realTime?.minutes ?? "?"}`;
};

interface ErrorInfo {
  type: "network" | "server" | "unknown";
  status?: number;
  message?: string;
}

const loadConsolidatedData = async (
  stopId: string
): Promise<ConsolidatedCirculation[]> => {
  const resp = await fetch(
    `${REGION_DATA.consolidatedCirculationsEndpoint}?stopId=${stopId}`,
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
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [selectedCirculationId, setSelectedCirculationId] = useState<
    string | undefined
  >(undefined);

  // Helper function to get the display name for the stop
  const getStopDisplayName = useCallback(() => {
    if (customName) return customName;
    if (stopData?.name.intersect) return stopData.name.intersect;
    if (stopData?.name.original) return stopData.name.original;
    return `Parada ${stopIdNum}`;
  }, [customName, stopData, stopIdNum]);

  usePageTitle(getStopDisplayName());

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

      const body = await loadConsolidatedData(params.id!);
      setData(body);
      setDataDate(new Date());

      // Load stop data from StopDataProvider
      const stop = await StopDataProvider.getStopById(stopIdNum);
      setStopData(stop);
      setCustomName(StopDataProvider.getCustomName(stopIdNum));
    } catch (error) {
      console.error("Error loading consolidated data:", error);
      setDataError(parseError(error));
      setData(null);
      setDataDate(null);
    } finally {
      setDataLoading(false);
    }
  }, [params.id, stopIdNum]);

  const refreshData = useCallback(async () => {
    await Promise.all([loadData()]);
  }, [loadData]);

  const handleManualRefresh = useCallback(async () => {
    try {
      setIsManualRefreshing(true);
      await refreshData();
    } finally {
      setIsManualRefreshing(false);
    }
  }, [refreshData]);

  useAutoRefresh({
    onRefresh: refreshData,
    interval: 12000,
    enabled: !dataError,
  });

  useEffect(() => {
    // Initial load
    loadData();

    StopDataProvider.pushRecent(parseInt(params.id ?? ""));
    setFavourited(
      StopDataProvider.isFavourite(parseInt(params.id ?? ""))
    );
  }, [params.id, loadData]);

  const toggleFavourite = () => {
    if (favourited) {
      StopDataProvider.removeFavourite(stopIdNum);
      setFavourited(false);
    } else {
      StopDataProvider.addFavourite(stopIdNum);
      setFavourited(true);
    }
  };

  const handleRename = () => {
    const current = getStopDisplayName();
    const input = window.prompt("Custom name for this stop:", current);
    if (input === null) return; // cancelled
    const trimmed = input.trim();
    if (trimmed === "") {
      StopDataProvider.removeCustomName(stopIdNum);
      setCustomName(undefined);
    } else {
      StopDataProvider.setCustomName(stopIdNum, trimmed);
      setCustomName(trimmed);
    }
  };

  return (
    <PullToRefresh onRefresh={handleManualRefresh}>
      <div className="page-container stops-page">
        <div className="stops-header">
          <div>
            <Star
              className={`star-icon ${favourited ? "active" : ""}`}
              onClick={toggleFavourite}
              width={20}
            />
            <Edit2
              className="edit-icon"
              onClick={handleRename}
              width={20}
            />
          </div>

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
                <LineIcon line={line} mode="rounded" />
              </div>
            ))}
          </div>
        )}

        {stopData && <StopAlert stop={stopData} />}

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
              onCirculationClick={(estimate, idx) => {
                setSelectedCirculationId(getCirculationId(estimate));
                setIsMapModalOpen(true);
              }}
            />
          ) : null}
        </div>

        {stopData && (
          <StopMapModal
            stop={stopData}
            circulations={(data ?? []).map((c) => ({
              id: getCirculationId(c),
              line: c.line,
              route: c.route,
              currentPosition: c.currentPosition,
              isPreviousTrip: c.isPreviousTrip,
              previousTripShapeId: c.previousTripShapeId,
              schedule: c.schedule
                ? {
                  shapeId: c.schedule.shapeId,
                }
                : undefined,
            }))}
            isOpen={isMapModalOpen}
            onClose={() => setIsMapModalOpen(false)}
            selectedCirculationId={selectedCirculationId}
          />
        )}
      </div>
    </PullToRefresh>
  );
}
