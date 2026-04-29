import React from 'react';
import { 
  Users, 
  Receipt, 
  Calculator, 
  Truck, 
  RefreshCcw, 
  Printer, 
  Wrench, 
  FileText, 
  ShoppingCart, 
  Ban, 
  Trash2,
  TrendingUp,
  DollarSign
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Tile from '../components/ui/Tile';
import './Dashboard.css';

const data = [
  { name: 'Lun', ventas: 4000 },
  { name: 'Mar', ventas: 3000 },
  { name: 'Mié', ventas: 2000 },
  { name: 'Jue', ventas: 2780 },
  { name: 'Vie', ventas: 1890 },
  { name: 'Sáb', ventas: 2390 },
  { name: 'Dom', ventas: 3490 },
];

const Dashboard = () => {
  const modules = [
    { title: 'Clientes', icon: Users, color: 'info', path: '/customers' },
    { title: 'Facturación', icon: Receipt, color: 'success', path: '/billing' },
    { title: 'Presupuesto', icon: Calculator, color: 'warning', path: '/budget' },
    { title: 'Nota de Entrega', icon: Truck, color: 'info', path: '/delivery' },
    { title: 'Devolución de Facturas', icon: RefreshCcw, color: 'warning', path: '/returns' },
    { title: 'Reimpresión', icon: Printer, color: 'info', path: '/reprint' },
    { title: 'Orden de Servicio', icon: Wrench, color: 'info', path: '/service' },
    { title: 'Reportes', icon: FileText, color: 'info', path: '/reports' },
    { title: 'Pedidos', icon: ShoppingCart, color: 'success', path: '/orders' },
    { title: 'Anular Documento', icon: Ban, color: 'danger', path: '/void' },
    { title: 'Eliminar Documento', icon: Trash2, color: 'danger', path: '/delete' },
  ];

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Dashboard General</h1>
        <p className="subtitle">Resumen operativo del día</p>
      </div>

      <div className="kpi-section">
        <div className="kpi-card glass">
          <div className="kpi-icon bg-success-light">
            <DollarSign className="text-success" size={24} />
          </div>
          <div className="kpi-details">
            <h3>Ventas del Día</h3>
            <p className="kpi-value">Bs. 45,230.00</p>
            <span className="kpi-trend positive"><TrendingUp size={16} /> +12.5%</span>
          </div>
        </div>
        <div className="kpi-card glass">
          <div className="kpi-icon bg-info-light">
            <Receipt className="text-info" size={24} />
          </div>
          <div className="kpi-details">
            <h3>Facturas Emitidas</h3>
            <p className="kpi-value">124</p>
            <span className="kpi-trend positive"><TrendingUp size={16} /> +5.2%</span>
          </div>
        </div>
        <div className="kpi-card glass chart-card">
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: 'transparent'}} />
                <Bar dataKey="ventas" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="modules-section">
        <h2>Accesos Rápidos</h2>
        <div className="tiles-grid">
          {modules.map((mod, index) => (
            <Tile 
              key={index}
              title={mod.title}
              icon={mod.icon}
              color={mod.color}
              path={mod.path}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
