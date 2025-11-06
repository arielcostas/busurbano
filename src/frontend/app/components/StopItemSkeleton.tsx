import React from "react";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

interface StopItemSkeletonProps {
  showId?: boolean;
  stopId?: number;
}

const StopItemSkeleton: React.FC<StopItemSkeletonProps> = ({
  showId = false,
  stopId,
}) => {
  return (
    <SkeletonTheme baseColor="#f0f0f0" highlightColor="#e0e0e0">
      <li className="list-item">
        <div className="list-item-link">
          <span>{showId && stopId && <>({stopId}) </>}</span>
          <Skeleton
            width={showId ? "60%" : "80%"}
            style={{ display: "inline-block" }}
          />
          <div className="line-icons" style={{ marginTop: "4px" }}>
            <Skeleton
              count={3}
              width="30px"
              height="20px"
              inline={true}
              style={{ marginRight: "0.5rem" }}
            />
          </div>
        </div>
      </li>
    </SkeletonTheme>
  );
};

export default StopItemSkeleton;
