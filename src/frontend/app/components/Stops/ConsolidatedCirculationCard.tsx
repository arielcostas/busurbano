import { useMemo } from "react";
import Marquee from 'react-fast-marquee';
import { useTranslation } from "react-i18next";
import LineIcon from "~components/LineIcon";
import { type ConsolidatedCirculation } from "~routes/stops-$id";

import { AlertTriangle, LocateIcon } from "lucide-react";
import "./ConsolidatedCirculationCard.css";

interface ConsolidatedCirculationCardProps {
  estimate: ConsolidatedCirculation;
  onMapClick?: () => void;
  readonly?: boolean;
  reduced?: boolean;
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
> = ({ estimate, onMapClick, readonly, reduced }) => {
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
        label: reduced ? "OK" : t("estimates.delay_on_time"),
        tone: "delay-ok",
        kind: "delay",
      } as const;
    }

    // Delayed
    if (delta > 0) {
      const tone =
        delta <= 2 ? "delay-ok" : delta <= 10 ? "delay-warn" : "delay-critical";
      return {
        label: reduced ? `R${delta}` : t("estimates.delay_positive", {
          minutes: delta,
        }),
        tone,
        kind: "delay",
      } as const;
    }

    // Early
    const tone = absDelta <= 2 ? "delay-ok" : "delay-early";
    return {
      label: reduced ? `A${absDelta}` : t("estimates.delay_negative", {
        minutes: absDelta,
      }),
      tone,
      kind: "delay",
    } as const;
  }, [estimate.schedule, estimate.realTime, t, reduced]);

  const metaChips = useMemo(() => {
    const chips: Array<{ label: string; tone?: string, kind?: "regular" | "gps" | "delay" | "warning" }> = [];

    if (delayChip) {
      chips.push(delayChip);
    }

    if (estimate.schedule) {
      chips.push({
        label: `${parseServiceId(estimate.schedule.serviceId)} · ${getTripIdDisplay(
          estimate.schedule.tripId
        )}`,
        kind: "regular",
      });
    }

    if (estimate.realTime && estimate.realTime.distance >= 0) {
      chips.push({ label: formatDistance(estimate.realTime.distance), kind: "regular" });
    }

    if (estimate.currentPosition) {
      if (estimate.isPreviousTrip) {
        chips.push({ label: t("estimates.previous_trip"), kind: "gps" });
      } else {
        chips.push({ label: t("estimates.bus_gps_position"), kind: "gps" });
      }
    }

    if (timeClass === "time-delayed") {
      chips.push({
        label: reduced ? "!" : t("estimates.low_accuracy"),
        tone: "warning",
        kind: "warning",
      });
    }

    if (timeClass === "time-scheduled") {
      chips.push({
        label: reduced ? "⧗" : t("estimates.no_realtime"),
        tone: "warning",
        kind: "warning",
      });
    }

    return chips;
  }, [delayChip, estimate.schedule, estimate.realTime, timeClass, t, reduced]);

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

  if (reduced) {
    return (
      <Tag
        className={`
          flex-none flex items-center gap-2.5 min-h-12
          bg-(--message-background-color) border border-(--border-color)
          rounded-xl px-3 py-2.5 transition-all
          ${readonly
            ? !hasGpsPosition
              ? "opacity-70 cursor-not-allowed"
              : ""
            : hasGpsPosition
              ? "cursor-pointer hover:shadow-[0_4px_14px_rgba(0,0,0,0.08)] hover:border-(--button-background-color) hover:bg-[color-mix(in_oklab,var(--button-background-color)_5%,var(--message-background-color))] active:scale-[0.98]"
              : "opacity-70 cursor-not-allowed"
          }
        `.trim()}
        {...interactiveProps}
      >
        <div className="shrink-0 w-[7ch]">
          <LineIcon line={estimate.line} mode="pill" />
        </div>
        <div className="flex-1 min-w-0 flex flex-col gap-1">
          <strong className="text-base text-(--text-color) overflow-hidden text-ellipsis line-clamp-2 leading-tight">
            {estimate.route}
          </strong>
          {metaChips.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {metaChips.map((chip, idx) => {
                let chipColourClasses = "";
                switch (chip.tone) {
                  case "delay-ok":
                    chipColourClasses = "bg-green-600/20 dark:bg-green-600/30 text-green-700 dark:text-green-300";
                    break;
                  case "delay-warn":
                    chipColourClasses = "bg-amber-600/20 dark:bg-yellow-600/30 text-amber-700 dark:text-yellow-300";
                    break;
                  case "delay-critical":
                    chipColourClasses = "bg-red-400/20 dark:bg-red-600/30 text-red-600 dark:text-red-300";
                    break;
                  case "delay-early":
                    chipColourClasses = "bg-blue-400/20 dark:bg-blue-600/30 text-blue-700 dark:text-blue-300";
                    break;
                  case "warning":
                    chipColourClasses = "bg-orange-400/20 dark:bg-orange-600/30 text-orange-700 dark:text-orange-300";
                    break;
                  default:
                    chipColourClasses = "bg-black/[0.06] dark:bg-white/[0.12] text-[var(--text-color)]";
                }

                return (
                  <span
                    key={`${chip.label}-${idx}`}
                    className={`text-xs px-2 py-0.5 rounded-full flex items-center justify-center gap-1 shrink-0 ${chipColourClasses}`}
                  >
                    {chip.kind === "gps" && (<LocateIcon className="w-3 h-3 inline-block" />)}
                    {chip.kind === "warning" && (<AlertTriangle className="w-3 h-3 inline-block" />)}
                    {chip.label}
                  </span>
                );
              })}
            </div>
          )}
        </div>
        <div
          className={`
            inline-flex items-center justify-center px-2 py-1.5 rounded-xl shrink-0
            ${timeClass === "time-running"
              ? "bg-green-600/20 dark:bg-green-600/25 text-[#1a9e56] dark:text-[#22c55e]"
              : timeClass === "time-delayed"
                ? "bg-orange-600/20 dark:bg-orange-600/25 text-[#d06100] dark:text-[#fb923c]"
                : "bg-blue-900/20 dark:bg-blue-600/25 text-[#0b3d91] dark:text-[#93c5fd]"
            }
          `.trim()}
        >
          <div className="flex flex-col items-center leading-none">
            <span className="text-lg font-bold leading-none">{etaValue}</span>
            <span className="text-[0.65rem] uppercase tracking-wider mt-0.5 opacity-90">{etaUnit}</span>
          </div>
        </div>
      </Tag>
    );
  }

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
    >
      <>
        <div className="card-row main">
          <div className="line-info">
            <LineIcon line={estimate.line} mode="pill" />
          </div>
          <div className="route-info">
            <strong>{estimate.route}</strong>
            {estimate.nextStreets && estimate.nextStreets.length > 0 && (() => {
              const text = estimate.nextStreets.join(" — ");
              return (
                <Marquee speed={85} play={text.length > 30}>
                  <div className="mr-32 font-mono">
                    {text}
                  </div>
                </Marquee>
              );
            })()}
          </div>
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
                {chip.kind === "gps" && (<LocateIcon className="w-3 h-3 inline-block" />)}
                {chip.kind === "warning" && (<AlertTriangle className="w-3 h-3 inline-block" />)}
                {chip.label}
              </span>
            ))}
          </div>
        )}
      </>
    </Tag>
  );
};
