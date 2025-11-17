import { useTranslation } from "react-i18next";
import { type RegionConfig } from "~data/RegionConfig";
import { type ConsolidatedCirculation } from "~routes/stops-$id";
import { ConsolidatedCirculationCard } from "./ConsolidatedCirculationCard";

import "./ConsolidatedCirculationList.css";

interface RegularTableProps {
  data: ConsolidatedCirculation[];
  dataDate: Date | null;
  regionConfig: RegionConfig;
}

export const ConsolidatedCirculationList: React.FC<RegularTableProps> = ({
  data,
  dataDate,
  regionConfig,
}) => {
  const { t } = useTranslation();

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
          {sortedData.map((estimate, idx) => (
            <ConsolidatedCirculationCard
              key={idx}
              estimate={estimate}
              regionConfig={regionConfig}
            />
          ))}
        </>
      )}
    </>
  );
};
