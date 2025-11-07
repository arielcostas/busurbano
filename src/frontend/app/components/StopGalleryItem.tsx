import React from "react";
import { Link } from "react-router";
import { type Stop } from "../data/StopDataProvider";
import LineIcon from "./LineIcon";
import { useApp } from "../AppContext";
import StopDataProvider from "../data/StopDataProvider";

interface StopGalleryItemProps {
  stop: Stop;
}

const StopGalleryItem: React.FC<StopGalleryItemProps> = ({ stop }) => {
  const { region } = useApp();

  return (
    <div className="gallery-item">
      <Link className="gallery-item-link" to={`/estimates/${stop.stopId}`}>
        <div className="gallery-item-header">
          {stop.favourite && <span className="favourite-icon">★</span>}
          <span className="gallery-item-code">({stop.stopId})</span>
        </div>
        <div className="gallery-item-name">
          {StopDataProvider.getDisplayName(region, stop)}
        </div>
        <div className="gallery-item-lines">
          {stop.lines?.slice(0, 5).map((line) => (
            <LineIcon key={line} line={line} region={region} />
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
