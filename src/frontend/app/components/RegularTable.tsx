import { useTranslation } from "react-i18next";
import { type StopDetails } from "../routes/estimates-$id";
import LineIcon from "./LineIcon";

interface RegularTableProps {
  data: StopDetails;
  dataDate: Date | null;
}

export const RegularTable: React.FC<RegularTableProps> = ({
  data,
  dataDate,
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
          <th>{t("estimates.distance", "Distancia")}</th>
        </tr>
      </thead>

      <tbody>
        {data.estimates
          .sort((a, b) => a.minutes - b.minutes)
          .map((estimate, idx) => (
            <tr key={idx}>
              <td>
                <LineIcon line={estimate.line} />
              </td>
              <td>{estimate.route}</td>
              <td>
                {estimate.minutes > 15
                  ? absoluteArrivalTime(estimate.minutes)
                  : `${estimate.minutes} ${t("estimates.minutes", "min")}`}
              </td>
              <td>
                {estimate.meters > -1
                  ? formatDistance(estimate.meters)
                  : t("estimates.not_available", "No disponible")}
              </td>
            </tr>
          ))}
      </tbody>

      {data?.estimates.length === 0 && (
        <tfoot>
          <tr>
            <td colSpan={4}>
              {t("estimates.none", "No hay estimaciones disponibles")}
            </td>
          </tr>
        </tfoot>
      )}
    </table>
  );
};
