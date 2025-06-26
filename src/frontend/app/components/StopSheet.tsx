import React, { useEffect, useState } from "react";
import { Sheet } from "react-modal-sheet";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import LineIcon from "./LineIcon";
import { type StopDetails } from "../routes/estimates-$id";
import "./StopSheet.css";

interface StopSheetProps {
  isOpen: boolean;
  onClose: () => void;
  stopId: number;
  stopName: string;
}

const loadStopData = async (stopId: number): Promise<StopDetails> => {
  const resp = await fetch(`/api/GetStopEstimates?id=${stopId}`, {
    headers: {
      Accept: "application/json",
    },
  });
  return await resp.json();
};

export const StopSheet: React.FC<StopSheetProps> = ({
  isOpen,
  onClose,
  stopId,
  stopName,
}) => {
  const { t } = useTranslation();
  const [data, setData] = useState<StopDetails | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && stopId) {
      setLoading(true);
      setData(null);
      loadStopData(stopId)
        .then((stopData) => {
          setData(stopData);
        })
        .catch((error) => {
          console.error("Failed to load stop data:", error);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen, stopId]);

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
    data?.estimates.sort((a, b) => a.minutes - b.minutes).slice(0, 4) || [];

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      snapPoints={[0.5, 0.8, 0.95]}
      initialSnap={1}
    >
      <Sheet.Container>
        <Sheet.Header />
        <Sheet.Content>
          <div className="stop-sheet-content">
            <div className="stop-sheet-header">
              <h2 className="stop-sheet-title">{stopName}</h2>
              <span className="stop-sheet-id">({stopId})</span>
            </div>

            {loading && (
              <div className="stop-sheet-loading">
                {t("common.loading", "Loading...")}
              </div>
            )}

            {data && !loading && (
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
                            <LineIcon line={estimate.line} />
                          </div>
                          <div className="stop-sheet-estimate-details">
                            <div className="stop-sheet-estimate-route">
                              {estimate.route}
                            </div>
                            <div className="stop-sheet-estimate-time">
                              {formatTime(estimate.minutes)}
                              {estimate.meters > -1 && (
                                <span className="stop-sheet-estimate-distance">
                                  {" • "}
                                  {formatDistance(estimate.meters)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="stop-sheet-actions">
                  <Link
                    to={`/estimates/${stopId}`}
                    className="stop-sheet-view-all"
                    onClick={onClose}
                  >
                    {t("map.view_all_estimates", "Ver todas las estimaciones")}
                  </Link>
                </div>
              </>
            )}
          </div>
        </Sheet.Content>
      </Sheet.Container>
      <Sheet.Backdrop />
    </Sheet>
  );
};
