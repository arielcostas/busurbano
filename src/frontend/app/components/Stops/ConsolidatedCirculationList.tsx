import { Clock } from "lucide-react";
import { useTranslation } from "react-i18next";
import LineIcon from "~components/LineIcon";
import { type RegionConfig } from "~data/RegionConfig";
import { type ConsolidatedCirculation } from "~routes/stops-$id";

import "./ConsolidatedCirculationList.css";

interface RegularTableProps {
  data: ConsolidatedCirculation[];
  dataDate: Date | null;
  regionConfig: RegionConfig;
}

// Utility function to parse service ID and get the turn number
const parseServiceId = (serviceId: string): string => {
  const parts = serviceId.split("_");
  if (parts.length === 0) return "";

  const lastPart = parts[parts.length - 1];
  if (lastPart.length < 6) return "";

  const last6 = lastPart.slice(-6);
  const lineCode = last6.slice(0, 3);
  const turnCode = last6.slice(-3);

  // Remove leading zeros from turn
  const turnNumber = parseInt(turnCode, 10).toString();

  // Parse line number with special cases
  const lineNumber = parseInt(lineCode, 10);
  let displayLine: string;

  switch (lineNumber) {
    case 1:
      displayLine = "C1";
      break;
    case 3:
      displayLine = "C3";
      break;
    case 30:
      displayLine = "N1";
      break;
    case 33:
      displayLine = "N4";
      break;
    case 8:
      displayLine = "A";
      break;
    case 101:
      displayLine = "H";
      break;
    case 150:
      displayLine = "REF";
      break;
    case 500:
      displayLine = "TUR";
      break;
    case 201:
      displayLine = "U1";
      break;
    case 202:
      displayLine = "U2";
      break;
    default:
      displayLine = `L${lineNumber}`;
  }

  return `${displayLine}-${turnNumber}`;
};

export const ConsolidatedCirculationList: React.FC<RegularTableProps> = ({
  data,
  dataDate,
  regionConfig,
}) => {
  const { t } = useTranslation();

  const absoluteArrivalTime = (minutes: number) => {
    const now = new Date();
    const arrival = new Date(now.getTime() + minutes * 60000);
    return Intl.DateTimeFormat(
      typeof navigator !== "undefined" ? navigator.language : "en",
      {
        hour: "2-digit",
        minute: "2-digit",
      },
    ).format(arrival);
  };

  const formatDistance = (meters: number) => {
    if (meters > 1024) {
      return `${(meters / 1000).toFixed(1)} km`;
    } else {
      return `${meters} ${t("estimates.meters", "m")}`;
    }
  };

  const getDelayText = (estimate: ConsolidatedCirculation): string | null => {
    if (!estimate.schedule || !estimate.realTime) {
      return null;
    }

    const delay = estimate.realTime.minutes - estimate.schedule.minutes;

    if (delay >= -1 && delay <= 2) {
      return "OK"
    } else if (delay > 2) {
      return "R" + delay;
    } else {
      return "A" + Math.abs(delay);
    }
  };

  const getTripIdDisplay = (tripId: string): string => {
    const parts = tripId.split("_");
    return parts.length > 1 ? parts[1] : tripId;
  };

  const getTimeClass = (estimate: ConsolidatedCirculation): string => {
    if (estimate.realTime && estimate.schedule?.running) {
      return "time-running";
    }

    if (estimate.realTime && !estimate.schedule) {
      return "time-running";
    } else if (estimate.realTime && !estimate.schedule?.running) {
      return "time-delayed";
    }

    return "time-scheduled";
  };

  const sortedData = [...data].sort(
    (a, b) =>
      (a.realTime?.minutes ?? a.schedule?.minutes ?? 999) -
      (b.realTime?.minutes ?? b.schedule?.minutes ?? 999),
  );

  return (
    <>
      <div className="consolidated-circulation-caption">
        {t("estimates.caption", "Estimaciones de llegadas a las {{time}}", {
          time: dataDate?.toLocaleTimeString(),
        })}
      </div>

      {sortedData.length === 0 ? (
        <div className="consolidated-circulation-no-data">
          {t("estimates.none", "No hay estimaciones disponibles")}
        </div>
      ) : (
        <>
          {sortedData.map((estimate, idx) => {
            const displayMinutes =
              estimate.realTime?.minutes ?? estimate.schedule?.minutes ?? 0;
            const timeClass = getTimeClass(estimate);
            const delayText = getDelayText(estimate);

            return (
              <div key={idx} className="consolidated-circulation-card">
                <div className="card-header">
                  <div className="line-info">
                    <LineIcon line={estimate.line} region={regionConfig.id} />
                  </div>

                  <div className="route-info">
                    <strong>{estimate.route}</strong>
                  </div>

                  <div className="time-info">
                    <div className={`arrival-time ${timeClass}`}>
                      <Clock />
                      {estimate.realTime
                        ? `${displayMinutes} ${t("estimates.minutes", "min")}`
                        : absoluteArrivalTime(displayMinutes)}
                    </div>
                    <div className="distance-info">
                      {estimate.schedule && (
                      <>
                      {parseServiceId(estimate.schedule.serviceId)} ({getTripIdDisplay(estimate.schedule.tripId)})
                      </>
                      )}

                      {estimate.schedule &&
                        estimate.realTime &&
                        estimate.realTime.distance >= 0 && <> &middot; </>}

                      {estimate.realTime && estimate.realTime.distance >= 0 && (
                        <>{formatDistance(estimate.realTime.distance)}</>
                      )}

                      {estimate.schedule &&
                        estimate.realTime &&
                        estimate.realTime.distance >= 0 && <> &middot; </>}

                      {delayText}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </>
      )}
    </>
  );
};
