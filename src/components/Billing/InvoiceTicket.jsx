import React from 'react';
import './InvoiceTicket.css';

const InvoiceTicket = ({ invoice, branch, settings, isPreview = false }) => {
    if (!invoice) return null;

    // Helper to get product name if not directly on item
    const getProductName = (item) => {
        return item.product_name || item.product?.name || `Producto #${item.product_id}`;
    };

    return (
        <div className={`ticket-container printable ${isPreview ? 'preview-ticket' : ''}`}>
            <div className="ticket-header">
                <h2 className="branch-name">{branch.name || 'RammerBot POS'}</h2>
                <p className="branch-rif">RIF: {branch.rif || 'J-000000000'}</p>
                <p className="branch-address">{branch.address || 'Venta Directa'}</p>
                {branch.phone && <p className="branch-phone">TEL: {branch.phone}</p>}
                {branch.fiscal_message && <p className="branch-fiscal-msg"><strong>{branch.fiscal_message}</strong></p>}
                <div className="ticket-divider">********************************</div>
            </div>

            <div className="ticket-divider">********************************</div>

            <div className="ticket-info">
                <p><strong>{
                    invoice.type === 'FACTURA' ? 'FACTURA' : 
                    invoice.type === 'NOTA_CREDITO' ? 'NOTA DE CRÉDITO' : 
                    invoice.type === 'NOTA_DEBITO' ? 'NOTA DE DEBITO' :
                    'PRESUPUESTO'
                }:</strong> {invoice.invoice_number}</p>
                <p><strong>CONTROL:</strong> {invoice.type === 'PRESUPUESTO' ? 'DOCUMENTO NO FISCAL' : invoice.control_number}</p>
                <p><strong>FECHA:</strong> {new Date(invoice.date).toLocaleString()}</p>
                {invoice.type === 'PRESUPUESTO' && (
                    <p><strong>VALIDEZ:</strong> 15 DÍAS HÁBILES</p>
                )}
                {(invoice.related_invoice_id || invoice.related_invoice_number) && (
                    <p><strong>REF. FACTURA:</strong> {invoice.related_invoice_number || `ID: ${invoice.related_invoice_id}`}</p>
                )}
                {invoice.reason && (
                    <p><strong>MOTIVO:</strong> {invoice.reason}</p>
                )}
            </div>

            <div className="ticket-divider">********************************</div>

            <div className="customer-info">
                <p><strong>CLIENTE:</strong> {invoice.customer_name || 'CONTADO'}</p>
                <p><strong>RIF/CI:</strong> {invoice.customer_document || 'V-00000000'}</p>
                <p><strong>DIRECCIÓN:</strong> {invoice.customer_address || 'N/A'}</p>
            </div>

            <div className="ticket-divider">--------------------------------</div>

            <table className="ticket-items">
                <thead>
                    <tr>
                        <th align="left">DESCRIPCIÓN</th>
                        <th align="right">CANT</th>
                        <th align="right">TOTAL</th>
                    </tr>
                </thead>
                <tbody>
                    {(invoice.items || []).map((item, index) => (
                        <tr key={index}>
                            <td>{getProductName(item)}</td>
                            <td align="right">{item.quantity}</td>
                            <td align="right">${(item.quantity * item.unit_price).toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="ticket-divider">--------------------------------</div>

            <div className="ticket-totals">
                <div className="total-row">
                    <span>SUBTOTAL (BASE):</span>
                    <span>${(invoice.subtotal || 0).toFixed(2)}</span>
                </div>
                <div className="total-row">
                    <span>IVA (16%):</span>
                    <span>${(invoice.iva_total || 0).toFixed(2)}</span>
                </div>
                {(invoice.igtf_total > 0) && (
                    <div className="total-row">
                        <span>IGTF (3%):</span>
                        <span>${invoice.igtf_total.toFixed(2)}</span>
                    </div>
                )}
                
                <div className="ticket-divider">--------------------------------</div>
                
                <div className="total-row main-total">
                    <span>TOTAL USD:</span>
                    <span>${(invoice.total_usd || 0).toFixed(2)}</span>
                </div>
                <div className="total-row bcv-rate">
                    <span>TASA BCV:</span>
                    <span>{(invoice.exchange_rate || 1).toFixed(2)} Bs.</span>
                </div>
                <div className="total-row main-total-ves">
                    <span>TOTAL BS:</span>
                    <span>{(invoice.total_ves || 0).toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs.</span>
                </div>
            </div>

            <div className="ticket-divider">********************************</div>

            <div className="ticket-footer">
                <p>GRACIAS POR SU COMPRA</p>
                <p>ESTE ES UN DOCUMENTO FISCAL</p>
                <p>RammerBot POS v1.0</p>
            </div>
        </div>
    );
};

export default InvoiceTicket;
