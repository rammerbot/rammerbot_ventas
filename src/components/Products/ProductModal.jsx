import React, { useState, useEffect } from 'react';
import { createProduct, updateProduct } from '../../services/productService';

const ProductModal = ({ product, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        code: '',
        name: '',
        description: '',
        price_buy: 0,
        price_sell: 0,
        stock: 0
    });
    const [error, setError] = useState(null);

    useEffect(() => {
        if (product) {
            setFormData({
                code: product.code,
                name: product.name,
                description: product.description || '',
                price_buy: product.price_buy,
                price_sell: product.price_sell,
                stock: product.stock
            });
        }
    }, [product]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (product) {
                await updateProduct(product.id, formData);
            } else {
                await createProduct(formData);
            }
            onSave();
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h3>{product ? 'Editar Producto' : 'Nuevo Producto'}</h3>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>
                <form className="customer-form" onSubmit={handleSubmit}>
                    {error && <div className="error-message">{error}</div>}
                    <div className="form-row">
                        <div className="form-group half">
                            <label>Código (SKU)</label>
                            <input 
                                type="text" 
                                value={formData.code} 
                                onChange={(e) => setFormData({...formData, code: e.target.value})} 
                                required 
                            />
                        </div>
                        <div className="form-group half">
                            <label>Nombre</label>
                            <input 
                                type="text" 
                                value={formData.name} 
                                onChange={(e) => setFormData({...formData, name: e.target.value})} 
                                required 
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Descripción</label>
                        <textarea 
                            value={formData.description} 
                            onChange={(e) => setFormData({...formData, description: e.target.value})} 
                        ></textarea>
                    </div>
                    <div className="form-row">
                        <div className="form-group half">
                            <label>Precio Compra ($)</label>
                            <input 
                                type="number" 
                                step="0.01"
                                value={formData.price_buy} 
                                onChange={(e) => setFormData({...formData, price_buy: parseFloat(e.target.value)})} 
                                disabled={!product}
                            />
                            {!product && <small>Se establecerá al registrar una compra.</small>}
                        </div>
                        <div className="form-group half">
                            <label>Precio Venta ($)</label>
                            <input 
                                type="number" 
                                step="0.01"
                                value={formData.price_sell} 
                                onChange={(e) => setFormData({...formData, price_sell: parseFloat(e.target.value)})} 
                                required 
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Stock</label>
                        <input 
                            type="number" 
                            value={formData.stock} 
                            onChange={(e) => setFormData({...formData, stock: parseInt(e.target.value)})} 
                            disabled
                        />
                        <small>El inventario solo se actualiza mediante registros de compras o ventas.</small>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="btn-primary">Guardar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProductModal;
