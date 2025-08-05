import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router";
import StopDataProvider from "../data/StopDataProvider";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { TimetableTable, type TimetableEntry } from "../components/TimetableTable";
import LineIcon from "../components/LineIcon";
import { useTranslation } from "react-i18next";
import "./timetable-$id.css";

const loadTimetableData = async (stopId: string) => {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  try {
    const resp = await fetch(`/api/GetStopTimetable?date=${today}&stopId=${stopId}`, {
      headers: {
        Accept: "application/json",
      },
    });
    if (!resp.ok) {
      throw new Error(`HTTP error! status: ${resp.status}`);
    }
    return await resp.json();
  } catch (error) {
    console.error('Error loading timetable data:', error);
    return [];
  }
};

// Utility function to compare times
const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

// Filter past entries (keep only a few recent past ones)
const filterTimetableData = (data: TimetableEntry[], currentTime: string, showPast: boolean = false): TimetableEntry[] => {
  if (showPast) return data;

  const currentMinutes = timeToMinutes(currentTime);
  const sortedData = [...data].sort((a, b) =>
    timeToMinutes(a.departure_time) - timeToMinutes(b.departure_time)
  );

  // Find the current position
  const currentIndex = sortedData.findIndex(entry =>
    timeToMinutes(entry.departure_time) >= currentMinutes
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
  const parts = serviceId.split('_');
  if (parts.length === 0) return '';

  const lastPart = parts[parts.length - 1];
  if (lastPart.length < 6) return '';

  const last6 = lastPart.slice(-6);
  const lineCode = last6.slice(0, 3);
  const turnCode = last6.slice(-3);

  // Remove leading zeros from turn
  const turnNumber = parseInt(turnCode, 10).toString();

  // Parse line number with special cases
  const lineNumber = parseInt(lineCode, 10);
  let displayLine: string;

  switch (lineNumber) {
    case 1: displayLine = "C1"; break;
    case 3: displayLine = "C3"; break;
    case 30: displayLine = "N1"; break;
    case 33: displayLine = "N4"; break;
    case 8: displayLine = "A"; break;
    case 101: displayLine = "H"; break;
    case 150: displayLine = "REF"; break;
    case 500: displayLine = "TUR"; break;
    default: displayLine = `L${lineNumber}`;
  }

  return `${displayLine}-${turnNumber}`;
};

export default function Timetable() {
  const { t } = useTranslation();
  const params = useParams();
  const stopIdNum = parseInt(params.id ?? "");
  const [timetableData, setTimetableData] = useState<TimetableEntry[]>([]);
  const [customName, setCustomName] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPastEntries, setShowPastEntries] = useState(false);
  const nextEntryRef = useRef<HTMLDivElement>(null);

  const currentTime = new Date().toTimeString().slice(0, 8); // HH:MM:SS
  const filteredData = filterTimetableData(timetableData, currentTime, showPastEntries);

  useEffect(() => {
    loadTimetableData(params.id!).then((timetableBody: TimetableEntry[]) => {
      setTimetableData(timetableBody);
      setLoading(false);
      if (timetableBody.length === 0) {
        setError(t("timetable.noDataAvailable", "No hay datos de horarios disponibles para hoy"));
      } else {
        // Scroll to next entry after a short delay to allow rendering
        setTimeout(() => {
          const currentMinutes = timeToMinutes(currentTime);
          const sortedData = [...timetableBody].sort((a, b) =>
            timeToMinutes(a.departure_time) - timeToMinutes(b.departure_time)
          );

          const nextIndex = sortedData.findIndex(entry =>
            timeToMinutes(entry.departure_time) >= currentMinutes
          );

          if (nextIndex !== -1 && nextEntryRef.current) {
            nextEntryRef.current.scrollIntoView({
              behavior: 'smooth',
              block: 'center'
            });
          }
        }, 500);
      }
    }).catch((err) => {
      setError(t("timetable.loadError", "Error al cargar los horarios"));
      setLoading(false);
    });

    setCustomName(StopDataProvider.getCustomName(stopIdNum));
  }, [params.id, stopIdNum, t, currentTime]);

  if (loading) {
    return <h1 className="page-title">{t("common.loading")}</h1>;
  }

  // Get stop name from timetable data or use stop ID
  const stopName = customName ||
    (timetableData.length > 0 ? `Parada ${params.id}` : `Parada ${params.id}`);

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
        <div className="error-message">
          <p>{error}</p>
          <p className="error-detail">
            {t("timetable.errorDetail", "Los horarios teóricos se actualizan diariamente. Inténtalo más tarde.")}
          </p>
        </div>
      ) : (
        <div className="timetable-full-content">
          <div className="timetable-controls">
            <button
              className={`past-toggle ${showPastEntries ? 'active' : ''}`}
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
        </div>
      )}
    </div>
  );
}

// Custom component for the full timetable with scroll reference
const TimetableTableWithScroll: React.FC<{
  data: TimetableEntry[];
  showAll: boolean;
  currentTime: string;
  nextEntryRef: React.RefObject<HTMLDivElement | null>;
}> = ({ data, showAll, currentTime, nextEntryRef }) => {
  const { t } = useTranslation();
  const nowMinutes = timeToMinutes(currentTime);

  return (
    <div className="timetable-container">
      <div className="timetable-caption">
        {t("timetable.fullCaption", "Horarios teóricos de la parada")}
      </div>

      <div className="timetable-cards">
        {data.map((entry, index) => {
          const entryMinutes = timeToMinutes(entry.departure_time);
          const isPast = entryMinutes < nowMinutes;
          const isNext = !isPast && (index === 0 || timeToMinutes(data[index - 1]?.departure_time || '00:00:00') < nowMinutes);

          return (
            <div
              key={`${entry.trip.id}-${index}`}
              ref={isNext ? nextEntryRef : null}
              className={`timetable-card${isPast ? " timetable-past" : ""}${isNext ? " timetable-next" : ""}`}
              style={{
                background: isPast
                  ? "var(--surface-past, #f3f3f3)"
                  : isNext
                  ? "var(--surface-next, #e8f5e8)"
                  : "var(--surface-future, #fff)"
              }}
            >
              <div className="card-header">
                <div className="line-info">
                  <LineIcon line={entry.line.name} />
                </div>

                <div className="destination-info">
                  {entry.trip.headsign && entry.trip.headsign.trim() ? (
                    <strong>{entry.trip.headsign}</strong>
                  ) : (
                    <strong>{t("timetable.noDestination", "Línea")} {entry.line.name}</strong>
                  )}
                </div>

                <div className="time-info">
                  <span className="departure-time">
                    {entry.departure_time.slice(0, 5)}
                  </span>
                  <div className="service-id">
                    {parseServiceId(entry.trip.service_id)}
                  </div>
                </div>
              </div>
              <div className="card-body">
                {!isPast && entry.next_streets.length > 0 && (
                  <div className="route-streets">
                    {entry.next_streets.join(' — ')}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {data.length === 0 && (
        <p className="no-data">{t("timetable.noData", "No hay datos de horarios disponibles")}</p>
      )}
    </div>
  );
};
