import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Receipt, Users, Settings, FileText, ShoppingCart, RefreshCcw } from 'lucide-react';
import './Sidebar.css';

const Sidebar = () => {
  const menuItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
    { name: 'Facturación', path: '/billing', icon: <Receipt size={20} /> },
    { name: 'Clientes', path: '/customers', icon: <Users size={20} /> },
    { name: 'Movimientos', path: '/movements', icon: <RefreshCcw size={20} /> },
    { name: 'Compras', path: '/purchases', icon: <ShoppingCart size={20} /> },
    { name: 'Reportes', path: '/reports', icon: <FileText size={20} /> },
    { name: 'Configuración', path: '/settings', icon: <Settings size={20} /> },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo-placeholder">
          <h2>POS System</h2>
          <span className="subtitle">SENIAT Compliant</span>
        </div>
      </div>
      
      <nav className="sidebar-nav">
        <ul>
          {menuItems.map((item, index) => (
            <li key={index}>
              <NavLink 
                to={item.path} 
                className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}
              >
                <span className="icon">{item.icon}</span>
                <span className="label">{item.name}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <div className="avatar">A</div>
          <div className="details">
            <span className="name">Admin User</span>
            <span className="role">Caja 01</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
