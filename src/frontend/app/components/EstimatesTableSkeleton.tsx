import React from "react";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { useTranslation } from "react-i18next";

interface EstimatesTableSkeletonProps {
  rows?: number;
}

export const EstimatesTableSkeleton: React.FC<EstimatesTableSkeletonProps> = ({
  rows = 3
}) => {
  const { t } = useTranslation();

  return (
    <SkeletonTheme baseColor="#f0f0f0" highlightColor="#e0e0e0">
      <table className="table">
        <caption>
          <Skeleton width="250px" />
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
          {Array.from({ length: rows }, (_, index) => (
            <tr key={`skeleton-${index}`}>
              <td>
                <Skeleton width="40px" height="24px" style={{ borderRadius: "4px" }} />
              </td>
              <td>
                <Skeleton width="120px" />
              </td>
              <td>
                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  <Skeleton width="60px" />
                  <Skeleton width="40px" />
                </div>
              </td>
              <td>
                <Skeleton width="50px" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </SkeletonTheme>
  );
};

interface EstimatesGroupedSkeletonProps {
  groups?: number;
  rowsPerGroup?: number;
}

export const EstimatesGroupedSkeleton: React.FC<EstimatesGroupedSkeletonProps> = ({
  groups = 3,
  rowsPerGroup = 2
}) => {
  const { t } = useTranslation();

  return (
    <SkeletonTheme baseColor="#f0f0f0" highlightColor="#e0e0e0">
      <table className="table grouped-table">
        <caption>
          <Skeleton width="250px" />
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
          {Array.from({ length: groups }, (_, groupIndex) => (
            <React.Fragment key={`group-${groupIndex}`}>
              {Array.from({ length: rowsPerGroup }, (_, rowIndex) => (
                <tr key={`skeleton-${groupIndex}-${rowIndex}`} className={rowIndex === 0 ? "group-start" : ""}>
                  <td>
                    {rowIndex === 0 && (
                      <Skeleton width="40px" height="24px" style={{ borderRadius: "4px" }} />
                    )}
                  </td>
                  <td>
                    <Skeleton width="120px" />
                  </td>
                  <td>
                    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                      <Skeleton width="60px" />
                      <Skeleton width="40px" />
                    </div>
                  </td>
                  <td>
                    <Skeleton width="50px" />
                  </td>
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </SkeletonTheme>
  );
};
