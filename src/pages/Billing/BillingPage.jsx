import React, { useState, useEffect } from 'react';
import { useBilling } from '../../context/BillingContext';
import { getProducts } from '../../services/productService';
import { getCustomers } from '../../services/customerService';
import { createInvoice, getFiscalSettings, fetchBCVRate, updateUSDRate } from '../../services/invoiceService';
import InvoiceTicket from '../../components/Billing/InvoiceTicket';
import { BASE_URL, getHeaders } from '../../services/apiUtils';
import './BillingPage.css';

const BillingPage = () => {
    const { 
        cart, setCart, 
        selectedCustomer, setSelectedCustomer,
        currency, setCurrency,
        paymentMethod, setPaymentMethod,
        clearBilling
    } = useBilling();

    const [products, setProducts] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [settings, setSettings] = useState(null);
    const [customerSearch, setCustomerSearch] = useState(selectedCustomer ? `${selectedCustomer.document_id} - ${selectedCustomer.name}` : '');
    const [showCustomerList, setShowCustomerList] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [docType, setDocType] = useState('FACTURA'); // FACTURA, NOTA_CREDITO, NOTA_DEBITO
    const [relatedInvoiceId, setRelatedInvoiceId] = useState(null);
    const [relatedInvoiceNumber, setRelatedInvoiceNumber] = useState('');
    const [noteReason, setNoteReason] = useState('');
    const [loading, setLoading] = useState(true);
    const [lastInvoice, setLastInvoice] = useState(null);
    const [branchInfo, setBranchInfo] = useState(null);
    const [refreshingBCV, setRefreshingBCV] = useState(false);
    
    // UI Feedback States (No blocking dialogs)
    const [isConfirming, setIsConfirming] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [processing, setProcessing] = useState(false);

    const loadInitialData = async () => {
        try {
            const bResponse = await fetch(`${BASE_URL}/branches/me/`, { headers: getHeaders() });
            if (bResponse.ok) {
                const bData = await bResponse.json();
                setBranchInfo(bData);
            }

            const [p, c, s] = await Promise.all([
                getProducts(),
                getCustomers(),
                getFiscalSettings()
            ]);
            setProducts(p);
            setCustomers(c);
            setSettings(s);
            
            if (s.usd_rate) syncBCV();
        } catch (err) {
            console.error("Load Error:", err);
        } finally {
            setLoading(false);
        }
    };

    const syncBCV = async () => {
        setRefreshingBCV(true);
        try {
            const bcvRate = await fetchBCVRate();
            if (bcvRate && bcvRate > 1) {
                await updateUSDRate(bcvRate);
                setSettings(prev => ({ ...prev, usd_rate: bcvRate }));
            }
        } catch (err) {
            console.warn("BCV Sync failed", err);
        } finally {
            setRefreshingBCV(false);
        }
    };

    useEffect(() => {
        loadInitialData();
    }, []);

    const addToCart = (product) => {
        if (product.stock <= 0) return;
        const existing = cart.find(item => item.id === product.id);
        if (existing) {
            if (existing.quantity >= product.stock) return;
            setCart(cart.map(item => 
                item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
            ));
        } else {
            setCart([...cart, { ...product, quantity: 1 }]);
        }
        setIsConfirming(false);
        setErrorMsg('');
    };

    const removeFromCart = (productId) => {
        setCart(cart.filter(item => item.id !== productId));
        setIsConfirming(false);
    };

    const updateQuantity = (productId, qty) => {
        const cartItem = cart.find(it => it.id === productId);
        const product = products.find(p => p.id === productId);
        const newQty = parseInt(qty) || 1;
        
        // 1. Check stock for normal sales
        if (docType === 'FACTURA' && newQty > (product?.stock || 0)) return;
        
        // 2. Check maxAvailable for NC (returns)
        if (docType === 'NOTA_CREDITO' && cartItem?.maxAvailable && newQty > cartItem.maxAvailable) {
            setErrorMsg(`⚠️ Máximo permitido para devolver: ${cartItem.maxAvailable}`);
            return;
        }

        setCart(cart.map(item => 
            item.id === productId ? { ...item, quantity: newQty } : item
        ));
        setIsConfirming(false);
    };

    const totalWithIVA = cart.reduce((acc, it) => acc + (it.quantity * it.price_sell), 0);
    const subtotal = totalWithIVA / 1.16;
    const iva = totalWithIVA - subtotal;
    const igtf = currency === 'USD' ? totalWithIVA * 0.03 : 0;
    const finalTotal = totalWithIVA + igtf;

    const handlePreProcess = () => {
        setErrorMsg('');
        if (!selectedCustomer) {
            setErrorMsg('⚠️ Seleccione un cliente');
            return;
        }
        if (cart.length === 0) {
            setErrorMsg('⚠️ El carrito está vacío');
            return;
        }
        if (docType !== 'FACTURA' && docType !== 'PRESUPUESTO' && !relatedInvoiceNumber) {
            setErrorMsg('⚠️ Ingrese la factura afectada');
            return;
        }
        setIsConfirming(true);
    };

    const searchRelatedInvoice = async () => {
        if (!relatedInvoiceNumber) return;
        setRefreshingBCV(true);
        setErrorMsg('');
        try {
            const response = await fetch(`${BASE_URL}/invoices/search/${relatedInvoiceNumber}/`, { headers: getHeaders() });
            if (!response.ok) throw new Error('Factura no encontrada');
            const inv = await response.json();
            
            setRelatedInvoiceId(inv.id);
            
            // 1. Auto-select customer
            const cust = customers.find(c => parseInt(c.id) === parseInt(inv.customer_id));
            if (cust) {
                setSelectedCustomer(cust);
                setCustomerSearch(`${cust.document_id} - ${cust.name}`);
            }

            // 2. Auto-load items into cart (Only remaining balance)
            if (inv.items && inv.items.length > 0) {
                // Get all other NCs for this invoice to calculate balance
                const allInvoicesResponse = await fetch(`${BASE_URL}/invoices/`, { headers: getHeaders() });
                const allInvoices = await allInvoicesResponse.json();
                
                const previousNCs = allInvoices.filter(i => 
                    i.related_invoice_id === inv.id && 
                    i.type === 'NOTA_CREDITO' && 
                    i.status === 'EMITIDA'
                );

                const alreadyReturned = {};
                previousNCs.forEach(nc => {
                    nc.items.forEach(it => {
                        alreadyReturned[it.product_id] = (alreadyReturned[it.product_id] || 0) + it.quantity;
                    });
                });

                const cartItems = inv.items.map(it => {
                    const prod = products.find(p => p.id === it.product_id);
                    const returnedQty = alreadyReturned[it.product_id] || 0;
                    const availableQty = it.quantity - returnedQty;
                    
                    if (availableQty <= 0) return null; // Skip if already fully returned

                    return {
                        id: it.product_id,
                        name: it.product_name || prod?.name || 'Producto',
                        code: prod?.code || '',
                        price_sell: it.unit_price,
                        quantity: availableQty, // Start with maximum possible to return
                        maxAvailable: availableQty, // For validation
                        stock: prod?.stock || 0
                    };
                }).filter(Boolean);

                if (cartItems.length === 0) {
                    alert("⚠️ Esta factura ya ha sido devuelta en su totalidad.");
                    setCart([]);
                } else {
                    setCart(cartItems);
                    alert(`Factura cargada. Mostrando solo el saldo disponible para devolver.`);
                }
            }
        } catch (err) {
            console.error("Search Error:", err);
            setErrorMsg('❌ Factura no encontrada');
            setRelatedInvoiceId(null);
        } finally {
            setRefreshingBCV(false);
        }
    };

    const handleFinalProcess = async () => {
        setProcessing(true);
        setErrorMsg('');
            const invoiceData = {
                customer_id: selectedCustomer.id,
                currency: currency,
                payment_method: paymentMethod,
                type: docType,
                related_invoice_id: relatedInvoiceId,
                reason: noteReason,
                items: cart.map(it => ({
                product_id: it.id,
                quantity: it.quantity,
                unit_price: it.price_sell,
                iva_percentage: 16
            }))
        };
        console.log("PROCESANDO VENTA FINAL CON DATOS:", invoiceData);
        try {
            const result = await createInvoice(invoiceData);
            console.log("VENTA CREADA EXITOSAMENTE:", result);
            setLastInvoice(result);
            
            // Success! 
            setIsConfirming(false);
            clearBilling();
            setCustomerSearch('');
            const p = await getProducts();
            setProducts(p);

            // Print check handled via side effect or prompt UI (not blocking)
        } catch (err) {
            console.error("ERROR CRÍTICO EN PROCESO DE VENTA:", err);
            setErrorMsg('❌ Error: ' + (err.message || 'Fallo de conexión'));
            setIsConfirming(false);
        } finally {
            setProcessing(false);
        }
    };

    const filteredProducts = (products || []).filter(p => 
        (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
        (p.code || '').toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 40);

    const filteredCustomers = (customers || [])
        .filter(c => !customerSearch || c.name.toLowerCase().includes(customerSearch.toLowerCase()) || c.document_id.toLowerCase().includes(customerSearch.toLowerCase()))
        .slice(0, 10);

    if (loading) return <div className="loading">Iniciando Punto de Venta...</div>;

    return (
        <div className="billing-page-v2">
            <div className="billing-layout">
                {/* PANEL IZQUIERDO: PRODUCTOS Y CARRITO */}
                <div className="billing-main-panel">
                    <div className="b-card b-search-section">
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px'}}>
                            <input 
                                type="text" 
                                placeholder="🔍 Buscar producto para facturar..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="b-search-input"
                            />
                            <span className="b-results-count">{filteredProducts.length} productos</span>
                        </div>
                        <div className="b-products-grid">
                            {filteredProducts.map(p => (
                                <div key={p.id} className={`b-product-tile ${p.stock <= 0 ? 'disabled' : ''}`} onClick={() => addToCart(p)}>
                                    <div className="b-tile-header">
                                        <span className="b-tile-name">{p.name}</span>
                                        <span className="b-tile-stock">Stock: {p.stock}</span>
                                    </div>
                                    <div className="b-tile-footer">
                                        <span className="b-tile-code">{p.code}</span>
                                        <span className="b-tile-price">${(p.price_sell || 0).toFixed(2)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="b-card b-cart-section">
                        <h3>🛒 Artículos en Venta</h3>
                        <div className="b-cart-container">
                            {cart.length === 0 ? (
                                <div className="b-empty-cart">El carrito está vacío. Agregue productos arriba.</div>
                            ) : (
                                cart.map(item => (
                                    <div key={item.id} className="b-cart-item">
                                        <div className="b-item-info">
                                            <span className="b-item-name">{item.name}</span>
                                            <span className="b-item-code">{item.code}</span>
                                        </div>
                                        <div className="b-item-actions">
                                            <div className="b-qty-control">
                                                <label>Cant.</label>
                                                <input 
                                                    type="number" 
                                                    min="1" 
                                                    value={item.quantity} 
                                                    onChange={(e) => updateQuantity(item.id, e.target.value)}
                                                />
                                            </div>
                                            <div className="b-price-display">
                                                <span>Unitario</span>
                                                <strong>${item.price_sell.toFixed(2)}</strong>
                                            </div>
                                            <div className="b-item-total">
                                                <span>Total</span>
                                                <strong>${(item.quantity * item.price_sell).toFixed(2)}</strong>
                                            </div>
                                            <button className="b-btn-remove" onClick={() => removeFromCart(item.id)}>&times;</button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* PANEL DERECHO: CLIENTE Y TOTALES */}
                <div className="billing-side-panel">
                    <div className="b-card">
                        <label className="b-label">Cliente Seleccionado</label>
                        <div className="b-select-wrapper">
                            <input 
                                type="text" 
                                placeholder="🔍 Buscar cliente..." 
                                value={customerSearch}
                                onChange={(e) => {
                                    setCustomerSearch(e.target.value);
                                    setShowCustomerList(true);
                                }}
                                onFocus={() => setShowCustomerList(true)}
                                className="b-input"
                            />
                            {showCustomerList && (
                                <div className="b-dropdown">
                                    {filteredCustomers.map(c => (
                                        <div key={c.id} className="b-dropdown-item" onClick={() => {
                                            setSelectedCustomer(c);
                                            setCustomerSearch(`${c.document_id} - ${c.name}`);
                                            setShowCustomerList(false);
                                            setIsConfirming(false);
                                        }}>
                                            <strong>{c.name}</strong>
                                            <small>{c.document_id}</small>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="b-card">
                        <label className="b-label">Tipo de Documento</label>
                        <select 
                            value={docType} 
                            onChange={(e) => {
                                setDocType(e.target.value);
                                if (e.target.value === 'FACTURA' || e.target.value === 'PRESUPUESTO') {
                                    setRelatedInvoiceId(null);
                                    setRelatedInvoiceNumber('');
                                }
                                setIsConfirming(false);
                            }} 
                            className="b-input"
                        >
                            <option value="FACTURA">📄 FACTURA</option>
                            <option value="NOTA_CREDITO">🔙 NOTA DE CRÉDITO</option>
                            <option value="NOTA_DEBITO">➕ NOTA DE DÉBITO</option>
                            <option value="PRESUPUESTO">📋 PRESUPUESTO</option>
                        </select>

                        {docType !== 'FACTURA' && docType !== 'PRESUPUESTO' && (
                            <div style={{marginTop: '15px'}}>
                                <label className="b-label">Factura que Afecta</label>
                                <div style={{display: 'flex', gap: '8px'}}>
                                    <input 
                                        type="text" 
                                        placeholder="Ej: F-000001" 
                                        className="b-input"
                                        value={relatedInvoiceNumber}
                                        onChange={(e) => setRelatedInvoiceNumber(e.target.value)}
                                    />
                                    <button 
                                        className="b-btn-refresh" 
                                        onClick={searchRelatedInvoice}
                                        title="Buscar factura original"
                                    >
                                        🔍
                                    </button>
                                </div>
                                <small style={{color: '#7e8299', fontSize: '0.7rem'}}>* Requerido: Busque la factura para validar.</small>
                            </div>
                        )}

                        {docType !== 'FACTURA' && docType !== 'PRESUPUESTO' && (
                            <div style={{marginTop: '15px'}}>
                                <label className="b-label">Motivo de la Nota</label>
                                <textarea 
                                    className="b-input" 
                                    rows="2" 
                                    placeholder="Ej: Devolución por desperfecto, ajuste de precio..."
                                    value={noteReason}
                                    onChange={(e) => setNoteReason(e.target.value)}
                                    style={{resize: 'none', fontFamily: 'inherit'}}
                                ></textarea>
                            </div>
                        )}
                    </div>

                    <div className="b-card">
                        <div className="b-form-group">
                            <label className="b-label">Moneda de Pago</label>
                            <select value={currency} onChange={(e) => {setCurrency(e.target.value); setIsConfirming(false);}} className="b-input">
                                <option value="VES">Bolívares (VES)</option>
                                <option value="USD">Dólares (USD)</option>
                            </select>
                        </div>
                        <div className="b-bcv-box">
                            <div style={{flex: 1}}>
                                <span className="b-bcv-label">Tasa BCV (editable)</span>
                                <div style={{display: 'flex', alignItems: 'center', gap: '5px'}}>
                                    <input 
                                        type="number" 
                                        step="0.01"
                                        value={settings?.usd_rate || ''} 
                                        onChange={(e) => setSettings(prev => ({ ...prev, usd_rate: parseFloat(e.target.value) || 0 }))}
                                        className="b-bcv-input"
                                    />
                                    <strong>VES</strong>
                                </div>
                            </div>
                            <button className="b-btn-refresh" onClick={syncBCV} disabled={refreshingBCV}>
                                {refreshingBCV ? '...' : '🔄'}
                            </button>
                        </div>
                    </div>

                    <div className="b-card b-totals-card">
                        <div className="b-total-row"><span>Base:</span> <span>${subtotal.toFixed(2)}</span></div>
                        <div className="b-total-row"><span>IVA (16%):</span> <span>${iva.toFixed(2)}</span></div>
                        {igtf > 0 && <div className="b-total-row b-igtf"><span>IGTF (3%):</span> <span>${igtf.toFixed(2)}</span></div>}
                        
                        <div className="b-total-final">
                            <div className="b-final-usd">
                                <span>TOTAL USD</span>
                                <strong>${finalTotal.toFixed(2)}</strong>
                            </div>
                            <div className="b-final-ves">
                                <span>TOTAL VES</span>
                                <strong>{(finalTotal * (settings?.usd_rate || 1)).toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs.</strong>
                            </div>
                        </div>
                    </div>

                    {errorMsg && <div className="b-error-bubble">{errorMsg}</div>}

                    {!isConfirming ? (
                        <button 
                            className="b-btn-process" 
                            onClick={handlePreProcess}
                            disabled={processing || cart.length === 0}
                        >
                            {processing ? 'PROCESANDO...' : 
                             docType === 'NOTA_CREDITO' ? 'PROCESAR NOTA DE CRÉDITO' :
                             docType === 'NOTA_DEBITO' ? 'PROCESAR NOTA DE DÉBITO' : 
                             docType === 'PRESUPUESTO' ? 'GENERAR PRESUPUESTO' :
                             'PROCESAR VENTA'}
                        </button>
                    ) : (
                        <div className="b-confirm-group">
                            <button className="b-btn-cancel" onClick={() => setIsConfirming(false)}>CANCELAR</button>
                            <button className="b-btn-confirm" onClick={handleFinalProcess} disabled={processing}>
                                {processing ? 'GENERANDO...' : 
                                 docType === 'NOTA_CREDITO' ? 'CONFIRMAR DEVOLUCIÓN' :
                                 docType === 'NOTA_DEBITO' ? 'CONFIRMAR AJUSTE' : 
                                 docType === 'PRESUPUESTO' ? 'CONFIRMAR PRESUPUESTO' :
                                 'CONFIRMAR VENTA'}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {lastInvoice && (
                <div className="print-overlay">
                    <div className="print-modal-preview">
                        <div className="preview-header">
                            <h3>✅ Venta Exitosa</h3>
                            <button className="btn-close-preview" onClick={() => setLastInvoice(null)}>&times;</button>
                        </div>
                        
                        <div className="preview-content">
                            <InvoiceTicket 
                                invoice={lastInvoice} 
                                branch={branchInfo || { name: 'RammerBot', rif: 'J-000000000', address: 'Venta Directa' }} 
                                settings={settings} 
                                isPreview={true}
                            />
                        </div>

                        <div className="preview-actions">
                            <button className="btn-print-now" onClick={() => window.print()}>
                                🖨️ IMPRIMIR TICKET FISCAL
                            </button>
                            <button className="btn-finish" onClick={() => setLastInvoice(null)}>
                                FINALIZAR Y NUEVA VENTA
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BillingPage;
