import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Receipt, 
  FileText, 
  Ban, 
  TrendingUp,
  DollarSign,
  AlertTriangle,
  Lightbulb,
  Star,
  Factory,
  Package,
  TrendingDown
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Tile from '../components/ui/Tile';
import { BASE_URL, getHeaders } from '../services/apiUtils';
import './Dashboard.css';

const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await fetch(`${BASE_URL}/dashboard/summary`, { headers: getHeaders() });
        if (!res.ok) throw new Error("Fallo de conexión");
        const data = await res.json();
        setSummary(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, []);

  const modules = [
    { title: 'Facturación', icon: Receipt, color: 'success', path: '/billing' },
    { title: 'Inventario', icon: Package, color: 'info', path: '/products' },
    { title: 'Clientes', icon: Users, color: 'info', path: '/customers' },
    { title: 'Reportes', icon: FileText, color: 'info', path: '/reports' },
    { title: 'Anular Factura', icon: Ban, color: 'danger', path: '/void' },
    { title: 'Proveedores', icon: Factory, color: 'warning', path: '/suppliers' },
  ];

  if (loading) return <div className="dashboard-loading">Cargando inteligencia de negocio...</div>;

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Dashboard General</h1>
        <p className="subtitle">Análisis de rendimiento y control operativo</p>
      </div>

      <div className="kpi-section">
        {/* KPI 1: Ventas */}
        <div className="kpi-card glass">
          <div className="kpi-icon bg-success-light">
            <DollarSign className="text-success" size={24} />
          </div>
          <div className="kpi-details">
            <h3>Ventas del Día</h3>
            <p className="kpi-value">Bs. {(summary?.today_total || 0).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</p>
            <span className={`kpi-trend ${summary?.today_total >= (summary?.yesterday_total || 0) ? 'positive' : 'negative'}`}>
              {summary?.today_total >= (summary?.yesterday_total || 0) ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              {summary?.yesterday_total > 0 
                ? ` ${(((summary.today_total - summary.yesterday_total) / summary.yesterday_total) * 100).toFixed(1)}%` 
                : ' 100%'}
            </span>
          </div>
        </div>

        {/* KPI 2: Gráfico de Tendencia */}
        <div className="kpi-card glass chart-card">
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary?.trend || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#7e8299', fontSize: 10}} />
                <YAxis hide />
                <Tooltip 
                  cursor={{fill: 'rgba(54,153,255,0.1)'}} 
                  contentStyle={{background: '#1e1e2d', border: 'none', borderRadius: '8px', color: '#fff'}}
                />
                <Bar dataKey="total" fill="#3699ff" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* KPI 3: Alertas de Stock (Ubicación Superior Derecha) */}
        <div className="kpi-card glass alert-kpi">
            <div className="kpi-icon bg-warning-light">
                <AlertTriangle className="text-warning" size={24} />
            </div>
            <div className="kpi-details" style={{width: '100%'}}>
                <h3>Vigilancia de Inventario</h3>
                <div className="alert-mini-list">
                    {summary?.low_stock_items?.length > 0 ? (
                        summary.low_stock_items.slice(0, 2).map(item => (
                            <div key={item.id} className="alert-mini-item">
                                <span className="mini-name">{item.name}</span>
                                <span className="mini-badge">Stock: {item.stock}</span>
                            </div>
                        ))
                    ) : (
                        <p className="no-data-mini">Inventario saludable ✅</p>
                    )}
                </div>
            </div>
        </div>
      </div>

      <div className="dashboard-content-main">
        <div className="modules-section">
            <h2 className="section-title">Accesos Rápidos</h2>
            <div className="tiles-grid">
                {modules.map((mod, index) => (
                    <Tile key={index} title={mod.title} icon={mod.icon} color={mod.color} path={mod.path} />
                ))}
            </div>
        </div>

        <div className="insights-section">
            <div className="insights-left">
                <h2 className="section-title">Análisis de Mercado</h2>
                <div className="rankings-container">
                    <div className="ranking-card glass">
                        <div className="alert-header">
                            <Star className="text-warning" size={20} />
                            <h3>Productos Estrella (Top 5)</h3>
                        </div>
                        <div className="ranking-list">
                            {(summary?.top_products?.length > 0) ? summary.top_products.map((p, i) => (
                                <div key={i} className="ranking-item">
                                    <span className="rank-num">{i+1}</span>
                                    <span className="rank-name">{p.name}</span>
                                    <span className="rank-value">{p.total_sold} vendidos</span>
                                </div>
                            )) : <p className="no-data">Sin ventas registradas</p>}
                        </div>
                    </div>

                    <div className="ranking-card glass">
                        <div className="alert-header">
                            <Factory className="text-info" size={20} />
                            <h3>Top Proveedores</h3>
                        </div>
                        <div className="ranking-list">
                            {(summary?.top_suppliers?.length > 0) ? summary.top_suppliers.map((s, i) => (
                                <div key={i} className="ranking-item">
                                    <span className="rank-num">{i+1}</span>
                                    <span className="rank-name">{s.name}</span>
                                    <span className="rank-value">Bs. {(s.total_purchased || 0).toLocaleString()}</span>
                                </div>
                            )) : <p className="no-data">Sin compras registradas</p>}
                        </div>
                    </div>
                </div>
            </div>

            <div className="insights-right">
                <h2 className="section-title">Sugerencias AI</h2>
                <div className="card-recommendation glass">
                    <div className="alert-header">
                        <Lightbulb className="text-info" size={20} />
                        <h3>Recomendaciones del Sistema</h3>
                    </div>
                    <div className="recommendation-list">
                        {summary?.recommendations?.map((rec, i) => (
                            <div key={i} className={`rec-item ${rec.type}`}>
                                {rec.message}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
