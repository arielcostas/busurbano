import React from "react";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { useTranslation } from "react-i18next";

interface TimetableSkeletonProps {
  rows?: number;
}

export const TimetableSkeleton: React.FC<TimetableSkeletonProps> = ({
  rows = 4,
}) => {
  const { t } = useTranslation();

  return (
    <SkeletonTheme
      baseColor="var(--skeleton-base)"
      highlightColor="var(--skeleton-highlight)"
    >
      <div className="timetable-container">
        <div className="timetable-caption">
          <Skeleton width="250px" height="1.1rem" />
        </div>

        <div className="timetable-cards">
          {Array.from({ length: rows }, (_, index) => (
            <div key={`timetable-skeleton-${index}`} className="timetable-card">
              <div className="card-header">
                <div className="line-info">
                  <Skeleton
                    width="40px"
                    height="24px"
                    style={{ borderRadius: "4px" }}
                  />
                </div>

                <div className="destination-info">
                  <Skeleton width="120px" height="0.95rem" />
                </div>

                <div className="time-info">
                  <Skeleton
                    width="60px"
                    height="1.1rem"
                    style={{ fontFamily: "monospace" }}
                  />
                </div>
              </div>

              <div className="card-body">
                <div className="route-streets">
                  <Skeleton
                    width="50px"
                    height="0.8rem"
                    style={{
                      display: "inline-block",
                      borderRadius: "3px",
                      marginRight: "0.5rem",
                    }}
                  />
                  <Skeleton
                    width="200px"
                    height="0.85rem"
                    style={{ display: "inline-block" }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </SkeletonTheme>
  );
};
