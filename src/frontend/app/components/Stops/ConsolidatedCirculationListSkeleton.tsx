import React from "react";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import "./ConsolidatedCirculationList.css";

export const ConsolidatedCirculationListSkeleton: React.FC = () => {
  return (
    <SkeletonTheme
      baseColor="var(--skeleton-base)"
      highlightColor="var(--skeleton-highlight)"
    >
      <div className="consolidated-circulation-container">
        <div className="consolidated-circulation-caption">
          <Skeleton width="60%" style={{ maxWidth: "300px" }} />
        </div>

        <div className="consolidated-circulation-list">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="consolidated-circulation-card">
              <div className="card-header">
                <div className="line-info">
                  <Skeleton width={40} height={28} borderRadius={4} />
                </div>

                <div className="route-info">
                  <Skeleton width="80%" height={18} />
                </div>

                <div className="time-info">
                  <Skeleton width={70} height={24} />
                  <Skeleton width={50} height={14} />
                </div>
              </div>

              <div className="card-footer">
                <Skeleton width="90%" height={14} />
                <Skeleton width="70%" height={14} style={{ marginTop: "4px" }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </SkeletonTheme>
  );
};
