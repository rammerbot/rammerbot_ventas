import React, { useState } from 'react';
import { Search, Ban, AlertTriangle, CheckCircle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BASE_URL, getHeaders } from '../../services/apiUtils';
import './VoidInvoicePage.css';

const VoidInvoicePage = () => {
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!invoiceNumber) return;
    
    setLoading(true);
    setError('');
    setInvoice(null);
    setSuccess('');

    try {
      const res = await fetch(`${BASE_URL}/invoices/search/${invoiceNumber.toUpperCase()}/`, {
        headers: getHeaders()
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Factura no encontrada");
      }
      
      const data = await res.json();
      setInvoice(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVoid = async () => {
    if (!invoice) return;
    
    if (!window.confirm(`¿Está seguro de que desea ANULAR la factura ${invoice.invoice_number}? Esta acción es irreversible y afectará el inventario y los reportes fiscales.`)) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/invoices/${invoice.id}/void`, {
        method: 'POST',
        headers: getHeaders()
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Error al anular la factura");
      }
      
      setSuccess("Documento anulado con éxito");
      setInvoice(prev => ({ ...prev, status: 'ANULADA' }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="void-page">
      <div className="void-header">
        <button onClick={() => navigate('/')} className="back-btn">
          <ArrowLeft size={20} />
        </button>
        <h1>Anular Documento Fiscal</h1>
      </div>

      <div className="search-container glass">
        <form onSubmit={handleSearch} className="search-form">
          <div className="input-group">
            <Search className="search-icon" size={20} />
            <input 
              type="text" 
              placeholder="Ingrese número de factura (ej: FAC-000001)" 
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              className="search-input"
            />
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Buscando..." : "Buscar Factura"}
          </button>
        </form>
      </div>

      {error && <div className="message error glass"><AlertTriangle size={20} /> {error}</div>}
      {success && <div className="message success glass"><CheckCircle size={20} /> {success}</div>}

      {invoice && (
        <div className="invoice-details glass">
          <div className="details-header">
            <div>
              <h2>{invoice.invoice_number}</h2>
              <span className={`status-badge ${invoice.status.toLowerCase()}`}>
                {invoice.status}
              </span>
            </div>
            <div className="invoice-date">
              Fecha: {new Date(invoice.date).toLocaleString()}
            </div>
          </div>

          <div className="details-grid">
            <div className="detail-item">
              <label>Cliente:</label>
              <span>{invoice.customer_name}</span>
            </div>
            <div className="detail-item">
              <label>RIF/Cédula:</label>
              <span>{invoice.customer_document}</span>
            </div>
            <div className="detail-item">
              <label>Monto Total:</label>
              <span className="amount">Bs. {invoice.total_ves.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          {invoice.status === 'EMITIDA' && (
            <div className="action-container">
              <div className="warning-note">
                <AlertTriangle className="text-warning" size={24} />
                <p>Al anular esta factura, los productos volverán automáticamente al inventario y el monto será excluido de los totales de venta del día.</p>
              </div>
              <button 
                onClick={handleVoid} 
                className="btn-danger" 
                disabled={loading}
              >
                <Ban size={20} /> Confirmar Anulación
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VoidInvoicePage;
