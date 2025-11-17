import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router";
import StopDataProvider from "../data/StopDataProvider";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
  Clock,
} from "lucide-react";
import { type ScheduledTable } from "~/components/SchedulesTable";
import { TimetableSkeleton } from "~/components/TimetableSkeleton";
import { ErrorDisplay } from "~/components/ErrorDisplay";
import LineIcon from "../components/LineIcon";
import { useTranslation } from "react-i18next";
import { type RegionId, getRegionConfig } from "~/data/RegionConfig";
import { useApp } from "~/AppContext";
import "./timetable-$id.css";

interface ErrorInfo {
  type: "network" | "server" | "unknown";
  status?: number;
  message?: string;
}

const loadTimetableData = async (
  region: RegionId,
  stopId: string
): Promise<ScheduledTable[]> => {
  const regionConfig = getRegionConfig(region);

  // Check if timetable is available for this region
  if (!regionConfig.timetableEndpoint) {
    throw new Error("Timetable not available for this region");
  }

  // Add delay to see skeletons in action (remove in production)
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format
  const resp = await fetch(
    `${regionConfig.timetableEndpoint}?date=${today}&stopId=${stopId}`,
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

// Utility function to compare times
const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

// Utility function to format GTFS time for display (handle hours >= 24)
const formatTimeForDisplay = (time: string): string => {
  const [hours, minutes] = time.split(":").map(Number);
  const normalizedHours = hours % 24;
  return `${normalizedHours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
};

// Filter past entries (keep only a few recent past ones)
const filterTimetableData = (
  data: ScheduledTable[],
  currentTime: string,
  showPast: boolean = false
): ScheduledTable[] => {
  if (showPast) return data;

  const currentMinutes = timeToMinutes(currentTime);
  const sortedData = [...data].sort(
    (a, b) => timeToMinutes(a.calling_time) - timeToMinutes(b.calling_time)
  );

  // Find the current position
  const currentIndex = sortedData.findIndex(
    (entry) => timeToMinutes(entry.calling_time) >= currentMinutes
  );

  if (currentIndex === -1) {
    // All entries are in the past, show last 3
    return sortedData.slice(-3);
  }

  // Show 3 past entries + all future entries
  const startIndex = Math.max(0, currentIndex - 3);
  return sortedData.slice(startIndex);
};

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
    default:
      displayLine = `L${lineNumber}`;
  }

  return `${displayLine}-${turnNumber}`;
};

// Scroll threshold for showing FAB buttons (in pixels)
const SCROLL_THRESHOLD = 100;

export default function Timetable() {
  const { t } = useTranslation();
  const { region } = useApp();
  const params = useParams();
  const stopIdNum = parseInt(params.id ?? "");
  const [timetableData, setTimetableData] = useState<ScheduledTable[]>([]);
  const [customName, setCustomName] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ErrorInfo | null>(null);
  const [showPastEntries, setShowPastEntries] = useState(false);
  const nextEntryRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const regionConfig = getRegionConfig(region);

  const currentTime = new Date().toTimeString().slice(0, 8); // HH:MM:SS
  const filteredData = filterTimetableData(
    timetableData,
    currentTime,
    showPastEntries
  );

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

  const loadData = async () => {
    // Check if timetable is available for this region
    if (!regionConfig.timetableEndpoint) {
      setError({
        type: "server",
        status: 501,
        message: "Timetable not available for this region",
      });
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const timetableBody = await loadTimetableData(region, params.id!);
      setTimetableData(timetableBody);

      if (timetableBody.length > 0) {
        // Scroll to next entry after a short delay to allow rendering
        setTimeout(() => {
          const currentMinutes = timeToMinutes(currentTime);
          const sortedData = [...timetableBody].sort(
            (a, b) =>
              timeToMinutes(a.calling_time) - timeToMinutes(b.calling_time)
          );

          const nextIndex = sortedData.findIndex(
            (entry) => timeToMinutes(entry.calling_time) >= currentMinutes
          );

          if (nextIndex !== -1 && nextEntryRef.current) {
            nextEntryRef.current.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
          }
        }, 500);
      }
    } catch (err) {
      console.error("Error loading timetable data:", err);
      setError(parseError(err));
      setTimetableData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    setCustomName(StopDataProvider.getCustomName(region, stopIdNum));
  }, [params.id, region]);

  // Scroll FABs moved to ScrollFabManager component

  if (loading) {
    return (
      <div className="page-container">
        <div className="timetable-full-header">
          <h1 className="page-title">
            {t("timetable.fullTitle", "Horarios teóricos")} ({params.id})
          </h1>
          <Link to={`/estimates/${params.id}`} className="back-link">
            <ArrowLeft className="back-icon" />
            {t("timetable.backToEstimates", "Volver a estimaciones")}
          </Link>
        </div>

        <div className="timetable-full-content">
          <div className="timetable-controls">
            <button className="past-toggle" disabled>
              <Eye className="toggle-icon" />
              {t("timetable.showPast", "Mostrar todos")}
            </button>
          </div>

          <TimetableSkeleton rows={8} />
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="timetable-full-header">
        <h1 className="page-title">
          {t("timetable.fullTitle", "Horarios teóricos")} ({params.id})
        </h1>
        <Link to={`/estimates/${params.id}`} className="back-link">
          <ArrowLeft className="back-icon" />
          {t("timetable.backToEstimates", "Volver a estimaciones")}
        </Link>
      </div>

      {error ? (
        <div className="timetable-full-content">
          <ErrorDisplay
            error={error}
            onRetry={loadData}
            title={t("errors.timetable_title", "Error al cargar horarios")}
          />
        </div>
      ) : timetableData.length === 0 ? (
        <div className="error-message">
          <p>
            {t(
              "timetable.noDataAvailable",
              "No hay datos de horarios disponibles para hoy"
            )}
          </p>
          <p className="error-detail">
            {t(
              "timetable.errorDetail",
              "Los horarios teóricos se actualizan diariamente. Inténtalo más tarde."
            )}
          </p>
        </div>
      ) : (
        <div className="timetable-full-content" ref={containerRef}>
          <div className="timetable-controls">
            <button
              className={`past-toggle ${showPastEntries ? "active" : ""}`}
              onClick={() => setShowPastEntries(!showPastEntries)}
            >
              {showPastEntries ? (
                <>
                  <EyeOff className="toggle-icon" />
                  {t("timetable.hidePast", "Ocultar pasados")}
                </>
              ) : (
                <>
                  <Eye className="toggle-icon" />
                  {t("timetable.showPast", "Mostrar todos")}
                </>
              )}
            </button>
          </div>

          <TimetableTableWithScroll
            data={filteredData}
            showAll={true}
            currentTime={currentTime}
            nextEntryRef={nextEntryRef}
          />

          {/* Floating Action Button */}
          <ScrollFabManager
            containerRef={containerRef}
            nextEntryRef={nextEntryRef}
            currentTime={currentTime}
            data={filteredData}
            disabled={loading || !!error || timetableData.length === 0}
          />
        </div>
      )}
    </div>
  );
}

// Custom component for the full timetable with scroll reference
const TimetableTableWithScroll: React.FC<{
  data: ScheduledTable[];
  showAll: boolean;
  currentTime: string;
  nextEntryRef: React.RefObject<HTMLDivElement | null>;
}> = ({ data, showAll, currentTime, nextEntryRef }) => {
  const { t } = useTranslation();
  const { region } = useApp();
  const nowMinutes = timeToMinutes(currentTime);

  return (
    <div className="timetable-container">
      <div className="timetable-caption">
        {t("timetable.fullCaption", "Horarios teóricos de la parada")}
      </div>

      <div className="timetable-cards">
        {data.map((entry, index) => {
          const entryMinutes = timeToMinutes(entry.calling_time);
          const isPast = entryMinutes < nowMinutes;
          const isNext =
            !isPast &&
            (index === 0 ||
              timeToMinutes(data[index - 1]?.calling_time || "00:00:00") <
                nowMinutes);

          return (
            <div
              key={`${entry.trip_id}-${index}`}
              ref={isNext ? nextEntryRef : null}
              className={`timetable-card${isPast ? " timetable-past" : ""}${isNext ? " timetable-next" : ""}`}
              style={{
                background: isPast
                  ? "var(--surface-past, #f3f3f3)"
                  : isNext
                    ? "var(--surface-next, #e8f5e8)"
                    : "var(--surface-future, #fff)",
              }}
            >
              <div className="card-header">
                <div className="line-info">
                  <LineIcon line={entry.line} region={region} />
                </div>

                <div className="destination-info">
                  {entry.route && entry.route.trim() ? (
                    <strong>{entry.route}</strong>
                  ) : (
                    <strong>
                      {t("timetable.noDestination", "Línea")} {entry.line}
                    </strong>
                  )}
                </div>

                <div className="time-info">
                  <span className="departure-time">
                    {formatTimeForDisplay(entry.calling_time)}
                  </span>
                  <div className="service-id">
                    {parseServiceId(entry.service_id)}
                  </div>
                </div>
              </div>
              <div className="card-body">
                {!isPast && entry.next_streets.length > 0 && (
                  <div className="route-streets">
                    {entry.next_streets.join(" — ")}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {data.length === 0 && (
        <p className="no-data">
          {t("timetable.noData", "No hay datos de horarios disponibles")}
        </p>
      )}
    </div>
  );
};

// Component to manage scroll-based FAB visibility globally within timetable
const ScrollFabManager: React.FC<{
  containerRef: React.RefObject<HTMLDivElement | null>;
  nextEntryRef: React.RefObject<HTMLDivElement | null>;
  currentTime: string;
  data: ScheduledTable[];
  disabled?: boolean;
}> = ({ containerRef, nextEntryRef, currentTime, data, disabled = false }) => {
  const { t } = useTranslation();
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [showGoToNow, setShowGoToNow] = useState(false);

  // Find the actual scrollable ancestor (.main-content) if our container isn't scrollable
  const getScrollContainer = () => {
    let el: HTMLElement | null = containerRef.current;
    while (el) {
      const style = getComputedStyle(el);
      const hasScroll = el.scrollHeight > el.clientHeight + 8;
      const overflowY = style.overflowY;
      if (hasScroll && (overflowY === "auto" || overflowY === "scroll")) {
        return el;
      }
      el = el.parentElement;
    }
    return null;
  };

  useEffect(() => {
    if (disabled) return;
    const scrollEl = getScrollContainer();
    const useWindowScroll = !scrollEl;

    const handleScroll = () => {
      const scrollTop = useWindowScroll
        ? window.scrollY || document.documentElement.scrollTop || 0
        : scrollEl!.scrollTop;
      const scrollHeight = useWindowScroll
        ? document.documentElement.scrollHeight
        : scrollEl!.scrollHeight;
      const clientHeight = useWindowScroll
        ? window.innerHeight
        : scrollEl!.clientHeight;

      const scrollBottom = scrollHeight - scrollTop - clientHeight;
      const threshold = 80; // slightly smaller threshold for responsiveness
      setShowScrollTop(scrollTop > threshold);
      setShowScrollBottom(scrollBottom > threshold);

      if (nextEntryRef.current) {
        const rect = nextEntryRef.current.getBoundingClientRect();
        const isNextVisible =
          rect.top >= 0 && rect.bottom <= window.innerHeight;
        setShowGoToNow(!isNextVisible);
      }
    };

    const target: any = useWindowScroll ? window : scrollEl!;
    target.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    handleScroll();
    return () => {
      target.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [containerRef, nextEntryRef, disabled, data, currentTime]);

  const scrollToTop = () => {
    const scrollEl = getScrollContainer();
    if (!scrollEl) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      scrollEl.scrollTo({ top: 0, behavior: "smooth" });
    }
  };
  const scrollToBottom = () => {
    const scrollEl = getScrollContainer();
    if (!scrollEl) {
      window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: "smooth",
      });
    } else {
      scrollEl.scrollTo({ top: scrollEl.scrollHeight, behavior: "smooth" });
    }
  };
  const scrollToNow = () => {
    nextEntryRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  };

  if (disabled) return null;
  if (!(showGoToNow || showScrollTop || showScrollBottom)) return null;

  return (
    <div className="fab-container">
      {showGoToNow && !showScrollTop && !showScrollBottom && (
        <button
          className="fab fab-now"
          onClick={scrollToNow}
          title={t("timetable.goToNow", "Ir a ahora")}
          aria-label={t("timetable.goToNow", "Ir a ahora")}
        >
          <Clock className="fab-icon" />
        </button>
      )}
      {showScrollTop && (
        <button
          className="fab fab-up"
          onClick={scrollToTop}
          title={t("timetable.scrollUp", "Subir")}
          aria-label={t("timetable.scrollUp", "Subir")}
        >
          <ChevronUp className="fab-icon" />
        </button>
      )}
      {showScrollBottom && !showScrollTop && (
        <button
          className="fab fab-down"
          onClick={scrollToBottom}
          title={t("timetable.scrollDown", "Bajar")}
          aria-label={t("timetable.scrollDown", "Bajar")}
        >
          <ChevronDown className="fab-icon" />
        </button>
      )}
    </div>
  );
};
