import { type JSX, useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router";
import StopDataProvider, { type Stop } from "../data/StopDataProvider";
import { Star, Edit2, ExternalLink, RefreshCw } from "lucide-react";
import "./estimates-$id.css";
import { RegularTable } from "../components/RegularTable";
import { useApp } from "../AppContext";
import { GroupedTable } from "../components/GroupedTable";
import { useTranslation } from "react-i18next";
import { TimetableTable, type TimetableEntry } from "../components/TimetableTable";
import { EstimatesTableSkeleton, EstimatesGroupedSkeleton } from "../components/EstimatesTableSkeleton";
import { TimetableSkeleton } from "../components/TimetableSkeleton";
import { ErrorDisplay } from "../components/ErrorDisplay";
import { PullToRefresh } from "../components/PullToRefresh";
import { useAutoRefresh } from "../hooks/useAutoRefresh";
import { type RegionId, getRegionConfig } from "../data/RegionConfig";

export interface Estimate {
  line: string;
  route: string;
  minutes: number;
  meters: number;
}

interface ErrorInfo {
  type: 'network' | 'server' | 'unknown';
  status?: number;
  message?: string;
}

const loadData = async (region: RegionId, stopId: string): Promise<Estimate[]> => {
  const regionConfig = getRegionConfig(region);
  const resp = await fetch(`${regionConfig.estimatesEndpoint}?id=${stopId}`, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!resp.ok) {
    throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
  }

  return await resp.json();
};

const loadTimetableData = async (region: RegionId, stopId: string): Promise<TimetableEntry[]> => {
  const regionConfig = getRegionConfig(region);

  // Check if timetable is available for this region
  if (!regionConfig.timetableEndpoint) {
    throw new Error("Timetable not available for this region");
  }

  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  const resp = await fetch(`${regionConfig.timetableEndpoint}?date=${today}&stopId=${stopId}`, {
    headers: {
      Accept: "application/json",
    },
  });

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

  // Estimates data state
  const [data, setData] = useState<Estimate[] | null>(null);
  const [dataDate, setDataDate] = useState<Date | null>(null);
  const [estimatesLoading, setEstimatesLoading] = useState(true);
  const [estimatesError, setEstimatesError] = useState<ErrorInfo | null>(null);

  // Timetable data state
  const [timetableData, setTimetableData] = useState<TimetableEntry[]>([]);
  const [timetableLoading, setTimetableLoading] = useState(true);
  const [timetableError, setTimetableError] = useState<ErrorInfo | null>(null);

  const [favourited, setFavourited] = useState(false);
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  const { tableStyle, region } = useApp();
  const regionConfig = getRegionConfig(region);

  const parseError = (error: any): ErrorInfo => {
    if (!navigator.onLine) {
      return { type: 'network', message: 'No internet connection' };
    }

    if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
      return { type: 'network' };
    }

    if (error.message?.includes('HTTP')) {
      const statusMatch = error.message.match(/HTTP (\d+):/);
      const status = statusMatch ? parseInt(statusMatch[1]) : undefined;
      return { type: 'server', status };
    }

    return { type: 'unknown', message: error.message };
  };

  const loadEstimatesData = useCallback(async () => {
    try {
      setEstimatesLoading(true);
      setEstimatesError(null);

      const body = await loadData(region, params.id!);
      setData(body);
      setDataDate(new Date());
      
      // Load stop data from StopDataProvider
      const stop = await StopDataProvider.getStopById(region, stopIdNum);
      setStopData(stop);
      setCustomName(StopDataProvider.getCustomName(region, stopIdNum));
    } catch (error) {
      console.error('Error loading estimates data:', error);
      setEstimatesError(parseError(error));
      setData(null);
      setDataDate(null);
    } finally {
      setEstimatesLoading(false);
    }
  }, [params.id, stopIdNum, region]);

  const loadTimetableDataAsync = useCallback(async () => {
    // Skip loading timetable if not available for this region
    if (!regionConfig.timetableEndpoint) {
      setTimetableLoading(false);
      return;
    }

    try {
      setTimetableLoading(true);
      setTimetableError(null);

      const timetableBody = await loadTimetableData(region, params.id!);
      setTimetableData(timetableBody);
    } catch (error) {
      console.error('Error loading timetable data:', error);
      setTimetableError(parseError(error));
      setTimetableData([]);
    } finally {
      setTimetableLoading(false);
    }
  }, [params.id, region, regionConfig.timetableEndpoint]);

  const refreshData = useCallback(async () => {
    await Promise.all([
      loadEstimatesData(),
      loadTimetableDataAsync()
    ]);
  }, [loadEstimatesData, loadTimetableDataAsync]);

  // Manual refresh function for pull-to-refresh and button
  const handleManualRefresh = useCallback(async () => {
    try {
      setIsManualRefreshing(true);
      // Only reload real-time estimates data, not timetable
      await loadEstimatesData();
    } finally {
      setIsManualRefreshing(false);
    }
  }, [loadEstimatesData]);

  // Auto-refresh estimates data every 30 seconds (only if not in error state)
  useAutoRefresh({
    onRefresh: loadEstimatesData,
    interval: 30000,
    enabled: !estimatesError,
  });

  useEffect(() => {
    // Initial load
    loadEstimatesData();
    loadTimetableDataAsync();

    StopDataProvider.pushRecent(region, parseInt(params.id ?? ""));
    setFavourited(StopDataProvider.isFavourite(region, parseInt(params.id ?? "")));
  }, [params.id, region, loadEstimatesData, loadTimetableDataAsync]);

  const toggleFavourite = () => {
    if (favourited) {
      StopDataProvider.removeFavourite(region, stopIdNum);
      setFavourited(false);
    } else {
      StopDataProvider.addFavourite(region, stopIdNum);
      setFavourited(true);
    }
  };

  const handleRename = () => {
    const current = customName ?? stopData?.name.intersect ?? stopData?.name.original;
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

  // Show loading skeleton while initial data is loading
  if (estimatesLoading && !data) {
    return (
      <PullToRefresh
        onRefresh={handleManualRefresh}
        isRefreshing={isManualRefreshing}
      >
        <div className="page-container estimates-page">
          <div className="estimates-header">
            <h1 className="page-title">
              <Star className="star-icon" />
              <Edit2 className="edit-icon" />
              {t("common.loading")}...
            </h1>
          </div>

          <div className="table-responsive">
            {tableStyle === "grouped" ? (
              <EstimatesGroupedSkeleton />
            ) : (
              <EstimatesTableSkeleton />
            )}
          </div>

          <div className="timetable-section">
            <TimetableSkeleton />
          </div>
        </div>
      </PullToRefresh>
    );
  }

  return (
    <PullToRefresh
      onRefresh={handleManualRefresh}
      isRefreshing={isManualRefreshing}
    >
      <div className="page-container estimates-page">
        <div className="estimates-header">
          <h1 className="page-title">
            <Star
              className={`star-icon ${favourited ? "active" : ""}`}
              onClick={toggleFavourite}
            />
            <Edit2 className="edit-icon" onClick={handleRename} />
            {customName ?? stopData?.name.intersect ?? stopData?.name.original ?? `Parada ${stopIdNum}`}{" "}
            <span className="estimates-stop-id">({stopIdNum})</span>
          </h1>

          <button
            className="manual-refresh-button"
            onClick={handleManualRefresh}
            disabled={isManualRefreshing || estimatesLoading}
            title={t("estimates.reload", "Recargar estimaciones")}
          >
            <RefreshCw className={`refresh-icon ${isManualRefreshing ? 'spinning' : ''}`} />
          </button>
        </div>

        <div className="table-responsive">
          {estimatesLoading ? (
            tableStyle === "grouped" ? (
              <EstimatesGroupedSkeleton />
            ) : (
              <EstimatesTableSkeleton />
            )
          ) : estimatesError ? (
            <ErrorDisplay
              error={estimatesError}
              onRetry={loadEstimatesData}
              title={t("errors.estimates_title", "Error al cargar estimaciones")}
            />
          ) : data ? (
            tableStyle === "grouped" ? (
              <GroupedTable data={data} dataDate={dataDate} regionConfig={regionConfig} />
            ) : (
              <RegularTable data={data} dataDate={dataDate} regionConfig={regionConfig} />
            )
          ) : null}
        </div>

        <div className="timetable-section">
          {timetableLoading ? (
            <TimetableSkeleton />
          ) : timetableError ? (
            <ErrorDisplay
              error={timetableError}
              onRetry={loadTimetableDataAsync}
              title={t("errors.timetable_title", "Error al cargar horarios")}
              className="compact"
            />
          ) : timetableData.length > 0 ? (
            <>
              <TimetableTable
                data={timetableData}
                currentTime={new Date().toTimeString().slice(0, 8)} // HH:MM:SS
              />
              <div className="timetable-actions">
                <Link
                  to={`/timetable/${params.id}`}
                  className="view-all-link"
                >
                  <ExternalLink className="external-icon" />
                  {t("timetable.viewAll", "Ver todos los horarios")}
                </Link>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </PullToRefresh>
  );
}
