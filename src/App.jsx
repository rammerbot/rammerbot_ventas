import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import Dashboard from './pages/Dashboard';
import './App.css';

// Placeholder para otras páginas
const PlaceholderPage = ({ title }) => (
  <div style={{ padding: '24px', backgroundColor: 'var(--color-white)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)' }}>
    <h2 style={{ color: 'var(--color-primary)', marginBottom: '16px' }}>{title}</h2>
    <p style={{ color: 'var(--color-text-muted)' }}>Módulo en construcción.</p>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="billing" element={<PlaceholderPage title="Módulo de Facturación" />} />
          <Route path="customers" element={<PlaceholderPage title="Módulo de Clientes" />} />
          <Route path="budget" element={<PlaceholderPage title="Módulo de Presupuesto" />} />
          <Route path="delivery" element={<PlaceholderPage title="Nota de Entrega" />} />
          <Route path="returns" element={<PlaceholderPage title="Devolución de Facturas" />} />
          <Route path="reprint" element={<PlaceholderPage title="Reimpresión de Documentos" />} />
          <Route path="service" element={<PlaceholderPage title="Orden de Servicio" />} />
          <Route path="reports" element={<PlaceholderPage title="Reportes del Sistema" />} />
          <Route path="orders" element={<PlaceholderPage title="Pedidos de Clientes" />} />
          <Route path="void" element={<PlaceholderPage title="Anular Documento" />} />
          <Route path="delete" element={<PlaceholderPage title="Eliminar Documento" />} />
          <Route path="*" element={<PlaceholderPage title="Página no encontrada" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
