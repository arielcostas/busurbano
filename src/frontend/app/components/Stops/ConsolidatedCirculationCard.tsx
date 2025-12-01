import { useMemo } from "react";
import Marquee from 'react-fast-marquee';
import { useTranslation } from "react-i18next";
import LineIcon from "~components/LineIcon";
import { type ConsolidatedCirculation } from "~routes/stops-$id";

import "./ConsolidatedCirculationCard.css";

interface ConsolidatedCirculationCardProps {
  estimate: ConsolidatedCirculation;
  onMapClick?: () => void;
  readonly?: boolean;
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

export const ConsolidatedCirculationCard: React.FC<
  ConsolidatedCirculationCardProps
> = ({ estimate, onMapClick, readonly }) => {
  const { t } = useTranslation();

  const formatDistance = (meters: number) => {
    if (meters > 1024) {
      return `${(meters / 1000).toFixed(1)} km`;
    }
    return `${meters} ${t("estimates.meters", "m")}`;
  };

  const getTripIdDisplay = (tripId: string): string => {
    const parts = tripId.split("_");
    return parts.length > 1 ? parts[1] : tripId;
  };

  const etaMinutes =
    estimate.realTime?.minutes ?? estimate.schedule?.minutes ?? null;
  const etaValue =
    etaMinutes === null ? "--" : Math.max(0, Math.round(etaMinutes)).toString();
  const etaUnit = t("estimates.minutes", "min");

  const timeClass = useMemo(() => {
    if (estimate.realTime && estimate.schedule?.running) {
      return "time-running";
    }
    if (estimate.realTime && !estimate.schedule) {
      return "time-running";
    }
    if (estimate.realTime && !estimate.schedule?.running) {
      return "time-delayed";
    }
    return "time-scheduled";
  }, [estimate.realTime, estimate.schedule]);

  const delayChip = useMemo(() => {
    if (!estimate.schedule || !estimate.realTime) {
      return null;
    }

    const delta = Math.round(
      estimate.realTime.minutes - estimate.schedule.minutes
    );
    const absDelta = Math.abs(delta);

    // On time
    if (delta === 0) {
      return {
        label: t("estimates.delay_on_time", "En hora (0 min)"),
        tone: "delay-ok",
      } as const;
    }

    // Delayed
    if (delta > 0) {
      const tone =
        delta <= 2 ? "delay-ok" : delta <= 10 ? "delay-warn" : "delay-critical";
      return {
        label: t("estimates.delay_positive", "Retraso de {{minutes}} min", {
          minutes: delta,
        }),
        tone,
      } as const;
    }

    // Early
    const tone = absDelta <= 2 ? "delay-ok" : "delay-early";
    return {
      label: t("estimates.delay_negative", "Adelanto de {{minutes}} min", {
        minutes: absDelta,
      }),
      tone,
    } as const;
  }, [estimate.schedule, estimate.realTime, t]);

  const metaChips = useMemo(() => {
    const chips: Array<{ label: string; tone?: string }> = [];
    if (delayChip) {
      chips.push(delayChip);
    }
    if (estimate.schedule) {
      chips.push({
        label: `${parseServiceId(estimate.schedule.serviceId)} · ${getTripIdDisplay(
          estimate.schedule.tripId
        )}`,
      });
    }
    if (estimate.realTime && estimate.realTime.distance >= 0) {
      chips.push({ label: formatDistance(estimate.realTime.distance) });
    }
    return chips;
  }, [delayChip, estimate.schedule, estimate.realTime]);

  // Check if bus has GPS position (live tracking)
  const hasGpsPosition = !!estimate.currentPosition;

  const Tag = readonly ? "div" : "button";
  const interactiveProps = readonly
    ? {}
    : {
      onClick: onMapClick,
      type: "button" as const,
      disabled: !hasGpsPosition,
    };

  return (
    <Tag
      className={`consolidated-circulation-card ${readonly
        ? !hasGpsPosition
          ? "no-gps"
          : ""
        : hasGpsPosition
          ? "has-gps"
          : "no-gps"
        }`}
      {...interactiveProps}
      aria-label={`${hasGpsPosition ? "View" : "No GPS data for"} ${estimate.line
        } to ${estimate.route}${hasGpsPosition ? " on map" : ""}`}
    >
      <div className="card-row main">
        <div className="line-info">
          <LineIcon line={estimate.line} mode="pill" />
        </div>
        <div className="route-info">
          <strong>{estimate.route}</strong>
        </div>
        {hasGpsPosition && (
          <div className="gps-indicator" title="Live GPS tracking">
            <span
              className={`gps-pulse ${estimate.isPreviousTrip ? "previous-trip" : ""
                }`}
            />
          </div>
        )}
        <div className={`eta-badge ${timeClass}`}>
          <div className="eta-text">
            <span className="eta-value">{etaValue}</span>
            <span className="eta-unit">{etaUnit}</span>
          </div>
        </div>
      </div>
      {metaChips.length > 0 && (
        <div className="card-row meta">
          {metaChips.map((chip, idx) => (
            <span
              key={`${chip.label}-${idx}`}
              className={`meta-chip ${chip.tone ?? ""}`.trim()}
            >
              {chip.label}
            </span>
          ))}

          {estimate.nextStreets && estimate.nextStreets.length > 0 && (
            <Marquee speed={85}>
              <div className="mr-64"></div>
              {estimate.nextStreets.join(" — ")}
            </Marquee>
          )}
        </div>
      )}
    </Tag>
  );
};
