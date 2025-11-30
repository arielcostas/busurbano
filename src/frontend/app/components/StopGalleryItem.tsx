import React from "react";
import { Link } from "react-router";
import StopDataProvider, { type Stop } from "../data/StopDataProvider";
import LineIcon from "./LineIcon";

interface StopGalleryItemProps {
  stop: Stop;
}

const StopGalleryItem: React.FC<StopGalleryItemProps> = ({ stop }) => {
  return (
    <div className="gallery-item">
      <Link className="gallery-item-link" to={`/stops/${stop.stopId}`}>
        <div className="gallery-item-header">
          {stop.favourite && <span className="favourite-icon">★</span>}
          <span className="gallery-item-code">({stop.stopId})</span>
        </div>
        <div className="gallery-item-name">
          {StopDataProvider.getDisplayName(stop)}
        </div>
        <div className="gallery-item-lines">
          {stop.lines?.slice(0, 5).map((line) => (
            <LineIcon key={line} line={line} />
          ))}
          {stop.lines && stop.lines.length > 5 && (
            <span className="more-lines">+{stop.lines.length - 5}</span>
          )}
        </div>
      </Link>
    </div>
  );
};

export default StopGalleryItem;
