import React from 'react';
import { Bell, Search, Menu } from 'lucide-react';
import './TopBar.css';

const TopBar = () => {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="icon-btn mobile-menu-toggle">
          <Menu size={24} />
        </button>
        <div className="search-bar">
          <Search size={18} className="search-icon" />
          <input type="text" placeholder="Buscar clientes, facturas o productos..." />
        </div>
      </div>
      
      <div className="topbar-right">
        <div className="system-status">
          <span className="status-indicator online"></span>
          <span className="status-text">SENIAT: Online</span>
        </div>
        <button className="icon-btn notification-btn">
          <Bell size={20} />
          <span className="badge">3</span>
        </button>
      </div>
    </header>
  );
};

export default TopBar;
