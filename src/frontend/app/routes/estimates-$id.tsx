import { type JSX, useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router";
import StopDataProvider from "../data/StopDataProvider";
import { Star, Edit2, ExternalLink } from "lucide-react";
import "./estimates-$id.css";
import { RegularTable } from "../components/RegularTable";
import { useApp } from "../AppContext";
import { GroupedTable } from "../components/GroupedTable";
import { useTranslation } from "react-i18next";
import { TimetableTable, type TimetableEntry } from "../components/TimetableTable";
import { useAutoRefresh } from "../hooks/useAutoRefresh";

export interface StopDetails {
  stop: {
    id: number;
    name: string;
    latitude: number;
    longitude: number;
  };
  estimates: {
    line: string;
    route: string;
    minutes: number;
    meters: number;
  }[];
}

const loadData = async (stopId: string) => {
  const resp = await fetch(`/api/GetStopEstimates?id=${stopId}`, {
    headers: {
      Accept: "application/json",
    },
  });
  return await resp.json();
};

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

export default function Estimates() {
  const { t } = useTranslation();
  const params = useParams();
  const stopIdNum = parseInt(params.id ?? "");
  const [customName, setCustomName] = useState<string | undefined>(undefined);
  const [data, setData] = useState<StopDetails | null>(null);
  const [dataDate, setDataDate] = useState<Date | null>(null);
  const [favourited, setFavourited] = useState(false);
  const [timetableData, setTimetableData] = useState<TimetableEntry[]>([]);
  const { tableStyle } = useApp();

  const loadEstimatesData = useCallback(async () => {
    const body: StopDetails = await loadData(params.id!);
    setData(body);
    setDataDate(new Date());
    setCustomName(StopDataProvider.getCustomName(stopIdNum));
  }, [params.id, stopIdNum]);

  const loadTimetableDataAsync = useCallback(async () => {
    const timetableBody: TimetableEntry[] = await loadTimetableData(params.id!);
    setTimetableData(timetableBody);
  }, [params.id]);

  const refreshData = useCallback(async () => {
    await Promise.all([
      loadEstimatesData(),
      loadTimetableDataAsync()
    ]);
  }, [loadEstimatesData, loadTimetableDataAsync]);

  // Auto-refresh estimates data every 30 seconds
  useAutoRefresh({
    onRefresh: loadEstimatesData,
    interval: 30000,
    enabled: true,
  });

  useEffect(() => {
    // Initial load
    loadEstimatesData();
    loadTimetableDataAsync();

    StopDataProvider.pushRecent(parseInt(params.id ?? ""));
    setFavourited(StopDataProvider.isFavourite(parseInt(params.id ?? "")));
  }, [params.id, loadEstimatesData, loadTimetableDataAsync]);

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
    const current = customName ?? data?.stop.name;
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

  if (data === null)
    return <h1 className="page-title">{t("common.loading")}</h1>;

  return (
    <div className="page-container estimates-page">
      <div className="estimates-header">
        <h1 className="page-title">
          <Star
            className={`star-icon ${favourited ? "active" : ""}`}
            onClick={toggleFavourite}
          />
          <Edit2 className="edit-icon" onClick={handleRename} />
          {customName ?? data.stop.name}{" "}
          <span className="estimates-stop-id">({data.stop.id})</span>
        </h1>
      </div>

        <div className="table-responsive">
          {tableStyle === "grouped" ? (
            <GroupedTable data={data} dataDate={dataDate} />
          ) : (
            <RegularTable data={data} dataDate={dataDate} />
          )}
        </div>

        <div className="timetable-section">
          <TimetableTable
            data={timetableData}
            currentTime={new Date().toTimeString().slice(0, 8)} // HH:MM:SS
          />

          {timetableData.length > 0 && (
            <div className="timetable-actions">
              <Link
                to={`/timetable/${params.id}`}
              className="view-all-link"
            >
              <ExternalLink className="external-icon" />
              {t("timetable.viewAll", "Ver todos los horarios")}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
