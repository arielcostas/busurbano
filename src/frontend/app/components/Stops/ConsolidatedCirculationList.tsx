import { useTranslation } from "react-i18next";
import { type ConsolidatedCirculation } from "~routes/stops-$id";
import { ConsolidatedCirculationCard } from "./ConsolidatedCirculationCard";

import { useCallback } from "react";
import "./ConsolidatedCirculationList.css";

interface ConsolidatedCirculationListProps {
  data: ConsolidatedCirculation[];
  onCirculationClick?: (estimate: ConsolidatedCirculation, index: number) => void;
  reduced?: boolean;
}

export const ConsolidatedCirculationList: React.FC<ConsolidatedCirculationListProps> = ({
  data,
  onCirculationClick,
  reduced,
}) => {
  const { t } = useTranslation();

  const sortedData = [...data].sort(
    (a, b) =>
      (a.realTime?.minutes ?? a.schedule?.minutes ?? 999) -
      (b.realTime?.minutes ?? b.schedule?.minutes ?? 999)
  );

  const generateKey = useCallback((estimate: ConsolidatedCirculation) => {
    if (estimate.realTime && estimate.schedule) {
      return `rt-${estimate.schedule.tripId}`;
    }

    return `sch-${estimate.schedule ? estimate.schedule.tripId : estimate.line + "-" + estimate.route}`;
  }, []);

  return (
    <>
      {sortedData.length === 0 ? (
        <div className="consolidated-circulation-no-data">
          {t("estimates.none", "No hay estimaciones disponibles")}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {sortedData.map((estimate, idx) => (
            <ConsolidatedCirculationCard
              reduced={reduced}
              key={generateKey(estimate)}
              estimate={estimate}
              onMapClick={() => onCirculationClick?.(estimate, idx)}
            />
          ))}
        </div>
      )}
    </>
  );
};
