import React, { useState, useEffect } from 'react';
import './NewPurchaseModal.css';
import { createPurchase } from '../../services/purchaseService';

const NewPurchaseModal = ({ suppliers, products, onClose, onSave }) => {
    const [supplierSearch, setSupplierSearch] = useState('');
    const [showSupplierList, setShowSupplierList] = useState(false);
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [supplierId, setSupplierId] = useState('');
    const [items, setItems] = useState([]); 
    const [globalDiscount, setGlobalDiscount] = useState(0);
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Estados para evitar diálogos bloqueantes (confirm/alert)
    const [isConfirming, setIsConfirming] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const addItem = (product) => {
        const existing = items.find(it => it.product_id === product.id);
        if (existing) {
            setItems(items.map(it => 
                it.product_id === product.id ? { ...it, quantity: it.quantity + 1 } : it
            ));
        } else {
            setItems([...items, { 
                product_id: product.id, 
                name: product.name,
                code: product.code,
                quantity: 1, 
                unit_cost: product.price_buy || 0, 
                iva_percentage: 16,
                discount_percent: 0 
            }]);
        }
        setErrorMsg('');
        setIsConfirming(false);
    };

    const updateItem = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = value;
        setItems(newItems);
        setIsConfirming(false);
    };

    const removeItem = (index) => {
        setItems(items.filter((_, i) => i !== index));
        setIsConfirming(false);
    };

    const calculateItemTotal = (it) => {
        const qty = parseFloat(it.quantity) || 0;
        const cost = parseFloat(it.unit_cost) || 0;
        const discPerc = parseFloat(it.discount_percent) || 0;
        const subtotalBeforeDisc = qty * cost;
        return subtotalBeforeDisc * (1 - discPerc / 100);
    };

    const totalWithIVA = (items || []).reduce((acc, it) => acc + calculateItemTotal(it), 0);
    const ivaTotal = (items || []).reduce((acc, it) => {
        const lineTotal = calculateItemTotal(it);
        const ivaPerc = parseFloat(it.iva_percentage) || 0;
        const base = lineTotal / (1 + ivaPerc / 100);
        return acc + (lineTotal - base);
    }, 0);
    const subtotal = totalWithIVA - ivaTotal;
    const totalFinal = totalWithIVA - (parseFloat(globalDiscount) || 0);

    const handlePreSubmit = () => {
        setErrorMsg('');
        if (!invoiceNumber) {
            setErrorMsg('⚠️ Ingrese número de factura');
            return;
        }
        if (!supplierId) {
            setErrorMsg('⚠️ Seleccione un proveedor');
            return;
        }
        if (items.length === 0) {
            setErrorMsg('⚠️ Agregue productos');
            return;
        }
        setIsConfirming(true);
    };

    const handleFinalSubmit = async () => {
        setSaving(true);
        setErrorMsg('');
        try {
            const purchaseData = {
                invoice_number: invoiceNumber,
                supplier_id: parseInt(supplierId),
                global_discount: parseFloat(globalDiscount) || 0,
                items: items.map(it => {
                    const lineTotal = calculateItemTotal(it);
                    const qty = parseFloat(it.quantity) || 0;
                    const cost = parseFloat(it.unit_cost) || 0;
                    const discountVal = (qty * cost) - lineTotal;

                    return {
                        product_id: it.product_id,
                        quantity: parseInt(it.quantity),
                        unit_cost: parseFloat(it.unit_cost),
                        discount_amount: discountVal,
                        iva_percentage: parseFloat(it.iva_percentage)
                    };
                })
            };
            
            await createPurchase(purchaseData);
            onSave(); // Esto cerrará el modal y refrescará la lista
        } catch (err) {
            console.error("API Error:", err);
            setErrorMsg('❌ Error: ' + (err.message || 'Fallo de red'));
            setIsConfirming(false);
        } finally {
            setSaving(false);
        }
    };

    const filteredProducts = (products || [])
        .filter(p => 
            (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
            (p.code || '').toLowerCase().includes(searchTerm.toLowerCase())
        )
        .slice(0, 40);

    const filteredSuppliers = (suppliers || [])
        .filter(s => !supplierSearch || s.name.toLowerCase().includes(supplierSearch.toLowerCase()) || s.rif.toLowerCase().includes(supplierSearch.toLowerCase()))
        .slice(0, 10);

    return (
        <div className="modal-overlay-p">
            <div className="p-modal-window">
                <div className="p-modal-header">
                    <h2>Carga de Factura de Compra</h2>
                    <button className="p-close-btn" onClick={onClose}>&times;</button>
                </div>

                <div className="p-modal-body">
                    <div className="p-panel-left">
                        <div className="p-card p-search-box">
                            <input 
                                type="text" 
                                placeholder="🔍 Buscar producto..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <div className="p-grid-products">
                                {filteredProducts.map(p => (
                                    <div key={p.id} className="p-product-tile" onClick={() => addItem(p)}>
                                        <div className="p-tile-info">
                                            <span className="p-tile-name">{p.name}</span>
                                            <span className="p-tile-code">{p.code}</span>
                                        </div>
                                        <div className="p-tile-price">${(p.price_buy || 0).toFixed(2)}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="p-card p-items-list">
                            <h3>Detalle de la Compra</h3>
                            <div className="p-items-container">
                                {items.length === 0 ? (
                                    <div className="p-empty-msg">Seleccione productos para empezar</div>
                                ) : (
                                    items.map((it, idx) => (
                                        <div key={idx} className="p-item-row">
                                            <div className="p-item-main">
                                                <span className="p-item-name">{it.name}</span>
                                                <span className="p-item-code">{it.code}</span>
                                            </div>
                                            <div className="p-item-controls">
                                                <div className="p-input-group">
                                                    <label>Cant.</label>
                                                    <input type="number" min="1" value={it.quantity} onChange={(e) => updateItem(idx, 'quantity', e.target.value)} />
                                                </div>
                                                <div className="p-input-group">
                                                    <label>Costo $</label>
                                                    <input type="number" step="0.01" value={it.unit_cost} onChange={(e) => updateItem(idx, 'unit_cost', e.target.value)} />
                                                </div>
                                                <div className="p-input-group">
                                                    <label>% Desc</label>
                                                    <input type="number" step="0.1" value={it.discount_percent} onChange={(e) => updateItem(idx, 'discount_percent', e.target.value)} />
                                                </div>
                                                <div className="p-item-subtotal">
                                                    <strong>${calculateItemTotal(it).toFixed(2)}</strong>
                                                </div>
                                                <button className="p-btn-remove" onClick={() => removeItem(idx)}>&times;</button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="p-panel-right">
                        <div className="p-card">
                            <label className="p-label">N° Factura</label>
                            <input type="text" className="p-input" value={invoiceNumber} onChange={(e) => {setInvoiceNumber(e.target.value); setIsConfirming(false);}} placeholder="000" />
                            
                            <label className="p-label" style={{marginTop: '15px'}}>Proveedor</label>
                            <div className="p-select-wrapper">
                                <input 
                                    type="text" 
                                    className="p-input" 
                                    placeholder="Buscar..." 
                                    value={supplierSearch}
                                    onChange={(e) => {
                                        setSupplierSearch(e.target.value);
                                        setShowSupplierList(true);
                                    }}
                                    onFocus={() => setShowSupplierList(true)}
                                />
                                {showSupplierList && (
                                    <div className="p-dropdown">
                                        {filteredSuppliers.map(s => (
                                            <div key={s.id} className="p-dropdown-item" onClick={() => {
                                                setSupplierId(s.id);
                                                setSupplierSearch(s.name);
                                                setShowSupplierList(false);
                                                setIsConfirming(false);
                                            }}>
                                                <strong>{s.name}</strong>
                                                <small>{s.rif}</small>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-card">
                            <label className="p-label">Descuento Global $</label>
                            <input type="number" className="p-input" step="0.01" value={globalDiscount} onChange={(e) => {setGlobalDiscount(parseFloat(e.target.value) || 0); setIsConfirming(false);}} />
                        </div>

                        <div className="p-card p-totals-card">
                            <div className="p-total-row"><span>Base:</span> <span>${subtotal.toFixed(2)}</span></div>
                            <div className="p-total-row"><span>IVA:</span> <span>${ivaTotal.toFixed(2)}</span></div>
                            <div className="p-total-final">
                                <span>TOTAL</span>
                                <strong>${totalFinal.toFixed(2)}</strong>
                            </div>
                        </div>

                        {/* MENSAJE DE ERROR INTEGRADO */}
                        {errorMsg && <div className="p-error-bubble">{errorMsg}</div>}

                        {/* BOTÓN DE DOS PASOS */}
                        {!isConfirming ? (
                            <button 
                                className="p-btn-submit" 
                                onClick={handlePreSubmit}
                                disabled={saving}
                            >
                                {saving ? 'PROCESANDO...' : 'GUARDAR FACTURA'}
                            </button>
                        ) : (
                            <div className="p-confirm-group">
                                <button className="p-btn-cancel" onClick={() => setIsConfirming(false)}>CANCELAR</button>
                                <button className="p-btn-confirm" onClick={handleFinalSubmit} disabled={saving}>
                                    {saving ? 'GUARDANDO...' : 'CONFIRMAR AHORA'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NewPurchaseModal;
