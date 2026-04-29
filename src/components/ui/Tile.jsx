import React from 'react';
import { Link } from 'react-router-dom';
import './Tile.css';

const Tile = ({ title, icon: Icon, color = 'info', path = '/', count }) => {
  return (
    <Link to={path} className={`tile tile-${color}`}>
      <div className="tile-content">
        <div className="tile-icon">
          <Icon size={32} />
        </div>
        <h3 className="tile-title">{title}</h3>
        {count !== undefined && <span className="tile-count">{count}</span>}
      </div>
    </Link>
  );
};

export default Tile;
