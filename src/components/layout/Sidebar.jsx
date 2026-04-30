import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Receipt, Users, Settings, FileText, ShoppingCart, RefreshCcw, LogOut, Sun, Moon, Package } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import './Sidebar.css';

const Sidebar = () => {
  const { user, logout, subdomain } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} />, roles: ['ADMINISTRADOR', 'VENDEDOR', 'AUDITOR', 'SUPERVISOR'] },
    { name: 'Facturación', path: '/billing', icon: <Receipt size={20} />, roles: ['ADMINISTRADOR', 'VENDEDOR', 'SUPERVISOR'] },
    { name: 'Clientes', path: '/customers', icon: <Users size={20} />, roles: ['ADMINISTRADOR', 'VENDEDOR', 'AUDITOR', 'SUPERVISOR'] },
    { name: 'Proveedores', path: '/suppliers', icon: <Users size={20} />, roles: ['ADMINISTRADOR', 'SUPERVISOR'] },
    { name: 'Inventario', path: '/products', icon: <Package size={20} />, roles: ['ADMINISTRADOR', 'VENDEDOR', 'SUPERVISOR'] },
    { name: 'Compras', path: '/purchases', icon: <ShoppingCart size={20} />, roles: ['ADMINISTRADOR', 'SUPERVISOR'] },
    { name: 'Movimientos', path: '/movements', icon: <RefreshCcw size={20} />, roles: ['ADMINISTRADOR', 'SUPERVISOR', 'AUDITOR'] },
    { name: 'Reportes', path: '/reports', icon: <FileText size={20} />, roles: ['ADMINISTRADOR', 'SUPERVISOR', 'AUDITOR'] },
    { name: 'Configuración', path: '/settings', icon: <Settings size={20} />, roles: ['ADMINISTRADOR'] },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo-container">
          <img src="/logo.png" alt="RammerBot Ventas Logo" className="logo-img" onError={(e) => { e.target.style.display = 'none'; }} />
          <div className="logo-text">
            <h2>RammerBot</h2>
            <span className="subtitle">Sucursal: {subdomain}</span>
          </div>
        </div>
      </div>
      
      <nav className="sidebar-nav">
        <ul>
          {menuItems
            .filter(item => item.roles.includes(user.role))
            .map((item, index) => (
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
          <div className="avatar">{user.username.charAt(0).toUpperCase()}</div>
          <div className="details">
            <span className="name">{user.username}</span>
            <span className="role">{user.role}</span>
          </div>
          <button className="theme-toggle" onClick={toggleTheme} title="Cambiar Tema">
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button className="logout-btn" onClick={handleLogout} title="Cerrar Sesión">
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
