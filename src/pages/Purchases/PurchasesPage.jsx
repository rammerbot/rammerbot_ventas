import React, { useState, useEffect } from 'react';
import { getPurchases } from '../../services/purchaseService';
import { getSuppliers } from '../../services/supplierService';
import { getProducts } from '../../services/productService';
import NewPurchaseModal from '../../components/Purchases/NewPurchaseModal';
import PurchaseDetailModal from '../../components/Purchases/PurchaseDetailModal';
import './PurchasesPage.css';

const PurchasesPage = () => {
    const [purchases, setPurchases] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedPurchase, setSelectedPurchase] = useState(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [pData, sData, prData] = await Promise.all([
                getPurchases(),
                getSuppliers(),
                getProducts()
            ]);
            setPurchases(pData);
            setSuppliers(sData);
            setProducts(prData);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    return (
        <div className="page-container">
            <div className="page-header">
                <h2>Historial de Compras</h2>
                <button className="btn-primary" onClick={() => setIsModalOpen(true)}>+ Registrar Compra</button>
            </div>

            {loading ? (
                <div className="loading">Cargando historial de compras...</div>
            ) : (
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Factura #</th>
                                <th>Proveedor</th>
                                <th>Total</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {purchases.length === 0 ? (
                                <tr><td colSpan="5" className="no-data">No hay compras registradas.</td></tr>
                            ) : (
                                purchases.map(p => (
                                    <tr key={p.id}>
                                        <td>{new Date(p.date).toLocaleDateString()}</td>
                                        <td>{p.invoice_number}</td>
                                        <td>{p.supplier_name || 'N/A'}</td>
                                        <td>${p.total_amount.toFixed(2)}</td>
                                        <td className="actions-cell">
                                            <button className="btn-edit" onClick={() => setSelectedPurchase(p)}>Ver Detalle</button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {isModalOpen && (
                <NewPurchaseModal 
                    suppliers={suppliers}
                    products={products}
                    onClose={() => setIsModalOpen(false)} 
                    onSave={() => { setIsModalOpen(false); fetchData(); }} 
                />
            )}

            {selectedPurchase && (
                <PurchaseDetailModal 
                    purchase={selectedPurchase} 
                    onClose={() => setSelectedPurchase(null)} 
                />
            )}
        </div>
    );
};

export default PurchasesPage;
