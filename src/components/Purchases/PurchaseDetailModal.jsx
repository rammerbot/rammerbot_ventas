import React from 'react';

const PurchaseDetailModal = ({ purchase, onClose }) => {
    if (!purchase) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{maxWidth: '800px'}}>
                <div className="modal-header">
                    <h3>Detalle de Factura: {purchase.invoice_number}</h3>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>
                <div className="customer-form">
                    <div className="form-row">
                        <div className="form-group half">
                            <label>Fecha</label>
                            <p>{new Date(purchase.date).toLocaleString()}</p>
                        </div>
                        <div className="form-group half">
                            <label>Proveedor</label>
                            <p><strong>{purchase.supplier_name}</strong> ({purchase.supplier_rif})</p>
                        </div>
                    </div>

                    <div className="items-section">
                        <h4>Productos Comprados</h4>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>ID Prod.</th>
                                    <th>Cant.</th>
                                    <th>Costo Unit.</th>
                                    <th>Desc.</th>
                                    <th>IVA %</th>
                                    <th>Subtotal</th>
                                </tr>
                            </thead>
                            <tbody>
                                {purchase.items.map((item) => (
                                    <tr key={item.id}>
                                        <td>{item.product_id}</td>
                                        <td>{item.quantity}</td>
                                        <td>${item.unit_cost.toFixed(2)}</td>
                                        <td>${item.discount_amount.toFixed(2)}</td>
                                        <td>{item.iva_percentage}%</td>
                                        <td>${item.subtotal.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="purchase-summary" style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginTop: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '15px'}}>
                        <p>Subtotal: ${purchase.subtotal.toFixed(2)}</p>
                        <p>IVA Total: ${purchase.iva_total.toFixed(2)}</p>
                        {purchase.global_discount > 0 && <p>Desc. Global: -${purchase.global_discount.toFixed(2)}</p>}
                        <h3 style={{color: 'var(--color-primary)', marginTop: '10px'}}>Total: ${purchase.total_amount.toFixed(2)}</h3>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn-primary" onClick={onClose}>Cerrar</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PurchaseDetailModal;
