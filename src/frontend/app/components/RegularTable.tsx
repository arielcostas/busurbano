import { useTranslation } from "react-i18next";
import { type Estimate } from "../routes/estimates-$id";
import LineIcon from "./LineIcon";
import { type RegionConfig } from "../data/RegionConfig";

interface RegularTableProps {
  data: Estimate[];
  dataDate: Date | null;
  regionConfig: RegionConfig;
}

export const RegularTable: React.FC<RegularTableProps> = ({
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
      }
    ).format(arrival);
  };

  const formatDistance = (meters: number) => {
    if (meters > 1024) {
      return `${(meters / 1000).toFixed(1)} km`;
    } else {
      return `${meters} ${t("estimates.meters", "m")}`;
    }
  };

  return (
    <table className="table">
      <caption>
        {t("estimates.caption", "Estimaciones de llegadas a las {{time}}", {
          time: dataDate?.toLocaleTimeString(),
        })}
      </caption>

      <thead>
        <tr>
          <th>{t("estimates.line", "Línea")}</th>
          <th>{t("estimates.route", "Ruta")}</th>
          <th>{t("estimates.arrival", "Llegada")}</th>
          {regionConfig.showMeters && (
            <th>{t("estimates.distance", "Distancia")}</th>
          )}
        </tr>
      </thead>

      <tbody>
        {data
          .sort((a, b) => a.minutes - b.minutes)
          .map((estimate, idx) => (
            <tr key={idx}>
              <td>
                <LineIcon line={estimate.line} region={regionConfig.id} />
              </td>
              <td>{estimate.route}</td>
              <td>
                {estimate.minutes > 15
                  ? absoluteArrivalTime(estimate.minutes)
                  : `${estimate.minutes} ${t("estimates.minutes", "min")}`}
              </td>
              {regionConfig.showMeters && (
                <td>
                  {estimate.meters > -1
                    ? formatDistance(estimate.meters)
                    : t("estimates.not_available", "No disponible")}
                </td>
              )}
            </tr>
          ))}
      </tbody>

      {data?.length === 0 && (
        <tfoot>
          <tr>
            <td colSpan={regionConfig.showMeters ? 4 : 3}>
              {t("estimates.none", "No hay estimaciones disponibles")}
            </td>
          </tr>
        </tfoot>
      )}
    </table>
  );
};
