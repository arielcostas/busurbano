import React from "react";
import { Link } from "react-router";
import { useApp } from "../AppContext";
import StopDataProvider, { type Stop } from "../data/StopDataProvider";
import LineIcon from "./LineIcon";

interface StopItemProps {
  stop: Stop;
}

const StopItem: React.FC<StopItemProps> = ({ stop }) => {
  const { region } = useApp();

  return (
    <li className="list-item">
      <Link className="list-item-link" to={`/estimates/${stop.stopId}`}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span style={{ fontWeight: 600 }}>
            {stop.favourite && <span className="favourite-icon">★</span>}
            {StopDataProvider.getDisplayName(region, stop)}
          </span>
          <span style={{ fontSize: "0.85em", color: "var(--subtitle-color)", marginLeft: "0.5rem" }}>
            ({stop.stopId})
          </span>
        </div>
        <div className="line-icons" style={{ marginTop: "0.25rem" }}>
          {stop.lines?.map((line) => (
            <LineIcon key={line} line={line} region={region} />
          ))}
        </div>
      </Link>
    </li>
  );
};

export default StopItem;
