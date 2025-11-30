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
      <>
        <div className="consolidated-circulation-caption">
          <Skeleton width="60%" style={{ maxWidth: "300px" }} />
        </div>

        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="consolidated-circulation-card"
            style={{ marginBottom: "0.75rem" }}
          >
            <div className="card-row main">
              <div className="line-info">
                <Skeleton width={40} height={28} borderRadius={4} />
              </div>

              <div className="route-info">
                <Skeleton width="80%" height={18} />
              </div>

              <div className="eta-badge">
                <Skeleton width={50} height={40} borderRadius={12} />
              </div>
            </div>

            <div className="card-row meta">
              <Skeleton width={90} height={20} borderRadius={999} />
              <Skeleton width={70} height={20} borderRadius={999} />
              <Skeleton width={60} height={20} borderRadius={999} />
            </div>
          </div>
        ))}
      </>
    </SkeletonTheme>
  );
};
