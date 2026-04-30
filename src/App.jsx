import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { BillingProvider } from './context/BillingContext';
import MainLayout from './components/layout/MainLayout';
import Dashboard from './pages/Dashboard';
import CustomersPage from './pages/Customers/CustomersPage';
import SuppliersPage from './pages/Suppliers/SuppliersPage';
import ProductsPage from './pages/Products/ProductsPage';
import PurchasesPage from './pages/Purchases/PurchasesPage';
import BillingPage from './pages/Billing/BillingPage';
import ReportsPage from './pages/Reports/ReportsPage';
import Login from './components/auth/Login';
import ProtectedRoute from './components/auth/ProtectedRoute';
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
    <ThemeProvider>
      <AuthProvider>
        <BillingProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              
              <Route element={<ProtectedRoute />}>
                <Route path="/" element={<MainLayout />}>
                  <Route index element={<Dashboard />} />
                  <Route path="billing" element={<BillingPage />} />
                  <Route path="customers" element={<CustomersPage />} />
                  <Route path="suppliers" element={<SuppliersPage />} />
                  <Route path="products" element={<ProductsPage />} />
                  <Route path="purchases" element={<PurchasesPage />} />
                  <Route path="movements" element={<PlaceholderPage title="Movimientos" />} />
                  <Route path="reports" element={<ReportsPage />} />
                  
                  {/* Rutas de configuración solo para administradores */}
                  <Route element={<ProtectedRoute allowedRoles={['ADMINISTRADOR']} />}>
                    <Route path="settings" element={<PlaceholderPage title="Configuración" />} />
                  </Route>
    
                  <Route path="*" element={<PlaceholderPage title="Página no encontrada" />} />
                </Route>
              </Route>
            </Routes>
          </BrowserRouter>
        </BillingProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
