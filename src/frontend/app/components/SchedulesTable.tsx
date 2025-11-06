import { useTranslation } from "react-i18next";
import LineIcon from "./LineIcon";
import "./SchedulesTable.css";
import { useApp } from "~/AppContext";

export interface ScheduledTable {
  line: {
    name: string;
    colour: string;
  };
  trip: {
    id: string;
    service_id: string;
    headsign: string;
    direction_id: number;
  };
  route_id: string;
  departure_time: string;
  arrival_time: string;
  stop_sequence: number;
  shape_dist_traveled: number;
  next_streets: string[];
}

interface TimetableTableProps {
  data: ScheduledTable[];
  showAll?: boolean;
  currentTime?: string; // HH:MM:SS format
}

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

// Utility function to compare times
const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

// Utility function to find nearby entries
const findNearbyEntries = (entries: ScheduledTable[], currentTime: string, before: number = 4, after: number = 4): ScheduledTable[] => {
  if (!currentTime) return entries.slice(0, before + after);

  const currentMinutes = timeToMinutes(currentTime);
  const sortedEntries = [...entries].sort((a, b) =>
    timeToMinutes(a.departure_time) - timeToMinutes(b.departure_time)
  );

  let currentIndex = sortedEntries.findIndex(entry =>
    timeToMinutes(entry.departure_time) >= currentMinutes
  );

  if (currentIndex === -1) {
    // All entries are before current time, show last ones
    return sortedEntries.slice(-before - after);
  }

  const startIndex = Math.max(0, currentIndex - before);
  const endIndex = Math.min(sortedEntries.length, currentIndex + after);

  return sortedEntries.slice(startIndex, endIndex);
};

export const SchedulesTable: React.FC<TimetableTableProps> = ({
  data,
  showAll = false,
  currentTime
}) => {
  const { t } = useTranslation();
  const { region } = useApp();

  const displayData = showAll ? data : findNearbyEntries(data, currentTime || '');
  const nowMinutes = currentTime ? timeToMinutes(currentTime) : timeToMinutes(new Date().toTimeString().slice(0, 8));

  return (
    <div className="timetable-container">
      <div className="timetable-caption">
        {showAll
          ? t("timetable.fullCaption", "Horarios teóricos de la parada")
          : t("timetable.nearbyCaption", "Próximos horarios teóricos")
        }
      </div>

      <div className="timetable-cards">
        {displayData.map((entry, index) => {
          const entryMinutes = timeToMinutes(entry.departure_time);
          const isPast = entryMinutes < nowMinutes;
          return (
            <div
              key={`${entry.trip.id}-${index}`}
              className={`timetable-card${isPast ? " timetable-past" : ""}`}
              style={{
                background: isPast
                  ? "var(--surface-past, #f3f3f3)"
                  : "var(--surface-future, #fff)"
              }}
            >
              <div className="card-header">
                <div className="line-info">
                  <LineIcon line={entry.line.name} region={region} />
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
                </div>
              </div>
              <div className="card-body">
                <div className="route-streets">
                  <span className="service-id">
                    {parseServiceId(entry.trip.service_id)}
                  </span>
                  {entry.next_streets.length > 0 && (
                    <span> — {entry.next_streets.join(' — ')}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {displayData.length === 0 && (
        <p className="no-data">{t("timetable.noData", "No hay datos de horarios disponibles")}</p>
      )}
    </div>
  );
};
