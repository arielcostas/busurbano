import React from 'react';
import { Link } from 'react-router';
import { Stop } from '../data/StopDataProvider';
import LineIcon from './LineIcon';

interface StopItemProps {
  stop: Stop;
}

const StopItem: React.FC<StopItemProps> = ({ stop }) => {
  return (
    <li className="list-item">
      <Link className="list-item-link" to={`/estimates/${stop.stopId}`}>
        ({stop.stopId}) {stop.name}
        <div className="line-icons">
          {stop.lines?.map(line => <LineIcon key={line} line={line} />)}
        </div>
      </Link>
    </li>
  );
};

export default StopItem;