import React, { useEffect, useState } from "react";
import { Sheet } from "react-modal-sheet";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { Clock, ClockFading, Hourglass, RefreshCw } from "lucide-react";
import LineIcon from "./LineIcon";
import { StopSheetSkeleton } from "./StopSheetSkeleton";
import { ErrorDisplay } from "./ErrorDisplay";
import { type Estimate } from "../routes/estimates-$id";
import { type RegionId, getRegionConfig } from "../data/RegionConfig";
import { useApp } from "../AppContext";
import "./StopSheet.css";

interface StopSheetProps {
  isOpen: boolean;
  onClose: () => void;
  stopId: number;
  stopName: string;
}

interface ErrorInfo {
  type: 'network' | 'server' | 'unknown';
  status?: number;
  message?: string;
}

const loadStopData = async (region: RegionId, stopId: number): Promise<Estimate[]> => {
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

export const StopSheet: React.FC<StopSheetProps> = ({
  isOpen,
  onClose,
  stopId,
  stopName,
}) => {
  const { t } = useTranslation();
  const { region } = useApp();
  const regionConfig = getRegionConfig(region);
  const [data, setData] = useState<Estimate[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ErrorInfo | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

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

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      setData(null);

      const stopData = await loadStopData(region, stopId);
      setData(stopData);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Failed to load stop data:", err);
      setError(parseError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && stopId) {
      loadData();
    }
  }, [isOpen, stopId, region]);

  const formatTime = (minutes: number) => {
    if (minutes > 15) {
      const now = new Date();
      const arrival = new Date(now.getTime() + minutes * 60000);
      return Intl.DateTimeFormat(
        typeof navigator !== "undefined" ? navigator.language : "en",
        {
          hour: "2-digit",
          minute: "2-digit",
        }
      ).format(arrival);
    } else {
      return `${minutes} ${t("estimates.minutes", "min")}`;
    }
  };

  const formatDistance = (meters: number) => {
    if (meters > 1024) {
      return `${(meters / 1000).toFixed(1)} km`;
    } else {
      return `${meters} ${t("estimates.meters", "m")}`;
    }
  };

  // Show only the next 4 arrivals
  const limitedEstimates =
    data?.sort((a, b) => a.minutes - b.minutes).slice(0, 4) || [];

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      detent={"content-height" as any}
    >
      <Sheet.Container>
        <Sheet.Header />
        <Sheet.Content>
          <div className="stop-sheet-content">
            <div className="stop-sheet-header">
              <h2 className="stop-sheet-title">{stopName}</h2>
              <span className="stop-sheet-id">({stopId})</span>
            </div>

            {loading ? (
              <StopSheetSkeleton />
            ) : error ? (
              <ErrorDisplay
                error={error}
                onRetry={loadData}
                title={t("errors.estimates_title", "Error al cargar estimaciones")}
                className="compact"
              />
            ) : data ? (
              <>
                <div className="stop-sheet-estimates">
                  <h3 className="stop-sheet-subtitle">
                    {t("estimates.next_arrivals", "Next arrivals")}
                  </h3>

                  {limitedEstimates.length === 0 ? (
                    <div className="stop-sheet-no-estimates">
                      {t("estimates.none", "No hay estimaciones disponibles")}
                    </div>
                  ) : (
                    <div className="stop-sheet-estimates-list">
                      {limitedEstimates.map((estimate, idx) => (
                        <div key={idx} className="stop-sheet-estimate-item">
                          <div className="stop-sheet-estimate-line">
                            <LineIcon line={estimate.line} region={region} />
                          </div>
                          <div className="stop-sheet-estimate-details">
                            <div className="stop-sheet-estimate-route">
                              {estimate.route}
                            </div>
                          </div>
                          <div className="stop-sheet-estimate-arrival">
                            <div className={`stop-sheet-estimate-time ${estimate.minutes <= 15 ? 'is-minutes' : ''}`}>
                              <Clock />
                              {formatTime(estimate.minutes)}
                            </div>
                            <div className="stop-sheet-estimate-distance">
                              {formatDistance(estimate.meters)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="stop-sheet-footer">
                  {lastUpdated && (
                    <div className="stop-sheet-timestamp">
                      {t("estimates.last_updated", "Actualizado a las")}{" "}
                      {lastUpdated.toLocaleTimeString(undefined, {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit"
                      })}
                    </div>
                  )}

                  <div className="stop-sheet-actions">
                    <button
                      className="stop-sheet-reload"
                      onClick={loadData}
                      disabled={loading}
                      title={t("estimates.reload", "Recargar estimaciones")}
                    >
                      <RefreshCw className={`reload-icon ${loading ? 'spinning' : ''}`} />
                      {t("estimates.reload", "Recargar")}
                    </button>

                    <Link
                      to={`/estimates/${stopId}`}
                      className="stop-sheet-view-all"
                      onClick={onClose}
                    >
                      {t("map.view_all_estimates", "Ver todas las estimaciones")}
                    </Link>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </Sheet.Content>
      </Sheet.Container>
      <Sheet.Backdrop />
    </Sheet>
  );
};
