import React, { useState, useEffect } from 'react';
import { createSupplier, updateSupplier } from '../../services/supplierService';

const SupplierModal = ({ supplier, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        rif: '',
        name: '',
        address: '',
        phone: ''
    });
    const [error, setError] = useState(null);

    useEffect(() => {
        if (supplier) {
            setFormData({
                rif: supplier.rif,
                name: supplier.name,
                address: supplier.address || '',
                phone: supplier.phone || ''
            });
        }
    }, [supplier]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (supplier) {
                await updateSupplier(supplier.id, formData);
            } else {
                await createSupplier(formData);
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
                    <h3>{supplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}</h3>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>
                <form className="customer-form" onSubmit={handleSubmit}>
                    {error && <div className="error-message">{error}</div>}
                    <div className="form-group">
                        <label>RIF</label>
                        <input 
                            type="text" 
                            value={formData.rif} 
                            onChange={(e) => setFormData({...formData, rif: e.target.value})} 
                            required 
                        />
                    </div>
                    <div className="form-group">
                        <label>Nombre / Razón Social</label>
                        <input 
                            type="text" 
                            value={formData.name} 
                            onChange={(e) => setFormData({...formData, name: e.target.value})} 
                            required 
                        />
                    </div>
                    <div className="form-group">
                        <label>Teléfono</label>
                        <input 
                            type="text" 
                            value={formData.phone} 
                            onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                        />
                    </div>
                    <div className="form-group">
                        <label>Dirección</label>
                        <textarea 
                            value={formData.address} 
                            onChange={(e) => setFormData({...formData, address: e.target.value})} 
                        ></textarea>
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

export default SupplierModal;
