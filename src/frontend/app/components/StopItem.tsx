import React from "react";
import { Link } from "react-router";
import StopDataProvider, { type Stop } from "../data/StopDataProvider";
import LineIcon from "./LineIcon";
import { useApp } from "../AppContext";

interface StopItemProps {
  stop: Stop;
}

const StopItem: React.FC<StopItemProps> = ({ stop }) => {
  const { region } = useApp();

  return (
    <li className="list-item">
      <Link className="list-item-link" to={`/estimates/${stop.stopId}`}>
        {stop.favourite && <span className="favourite-icon">★</span>} (
        {stop.stopId}) {StopDataProvider.getDisplayName(region, stop)}
        <div className="line-icons">
          {stop.lines?.map((line) => <LineIcon key={line} line={line} region={region} />)}
        </div>
      </Link>
    </li>
  );
};

export default StopItem;
