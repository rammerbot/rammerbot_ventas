import React, { useState, useEffect } from 'react';
import './CustomerModal.css';
import { createCustomer, updateCustomer } from '../../services/customerService';

const CustomerModal = ({ customer, onClose, onSave }) => {
    const isEdit = !!customer;

    const [clientType, setClientType] = useState('NATURAL');
    const [prefix, setPrefix] = useState('V');
    const [documentNumber, setDocumentNumber] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        phone: '',
        email: ''
    });

    const [error, setError] = useState(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (customer) {
            const docId = customer.document_id;
            const currentPrefix = docId.charAt(0).toUpperCase();
            setPrefix(currentPrefix);
            setDocumentNumber(docId.substring(1));
            setClientType(['V', 'E', 'P'].includes(currentPrefix) ? 'NATURAL' : 'JURIDICA');
            setFormData({
                name: customer.name,
                address: customer.address,
                phone: customer.phone || '',
                email: customer.email || ''
            });
        }
    }, [customer]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const fullDocumentId = `${prefix}${documentNumber}`;
        
        if (formData.name.trim().length < 2) {
            setError('El nombre o razón social es requerido');
            return;
        }
        if (formData.address.trim().length < 5) {
            setError('La dirección fiscal es obligatoria (mínimo 5 caracteres)');
            return;
        }

        setSaving(true);
        setError(null);
        
        try {
            const dataToSave = { ...formData, document_id: fullDocumentId };
            if (isEdit) {
                await updateCustomer(customer.id, dataToSave);
            } else {
                await createCustomer(dataToSave);
            }
            onSave();
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h3>{isEdit ? 'Editar Cliente' : 'Nuevo Cliente'}</h3>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>
                
                <form onSubmit={handleSubmit} className="customer-form">
                    {error && <div className="error-message">{error}</div>}
                    
                    <div className="form-row">
                        <div className="form-group half">
                            <label>Tipo de Cliente</label>
                            <div className="type-toggle">
                                <button 
                                    type="button" 
                                    className={clientType === 'NATURAL' ? 'active' : ''} 
                                    onClick={() => { setClientType('NATURAL'); setPrefix('V'); }}
                                >
                                    Persona Natural
                                </button>
                                <button 
                                    type="button" 
                                    className={clientType === 'JURIDICA' ? 'active' : ''} 
                                    onClick={() => { setClientType('JURIDICA'); setPrefix('J'); }}
                                >
                                    Persona Jurídica
                                </button>
                            </div>
                        </div>
                        <div className="form-group half">
                            <label htmlFor="document_id">Cédula o RIF *</label>
                            <div className="document-input-group" style={{display: 'flex', gap: '5px'}}>
                                <select 
                                    value={prefix} 
                                    onChange={(e) => setPrefix(e.target.value)}
                                    className="prefix-select"
                                    style={{width: '70px'}}
                                >
                                    {clientType === 'NATURAL' ? (
                                        <>
                                            <option value="V">V</option>
                                            <option value="E">E</option>
                                            <option value="P">P</option>
                                        </>
                                    ) : (
                                        <>
                                            <option value="J">J</option>
                                            <option value="G">G</option>
                                        </>
                                    )}
                                </select>
                                <input
                                    type="number"
                                    value={documentNumber}
                                    onChange={(e) => setDocumentNumber(e.target.value)}
                                    placeholder="Número"
                                    required
                                    style={{flex: 1}}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="name">Nombre o Razón Social *</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Ej: Juan Pérez o Inversiones XYZ"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="address">Dirección Fiscal (SENIAT) *</label>
                        <textarea
                            id="address"
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            placeholder="Dirección fiscal completa"
                            required
                            rows="3"
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group half">
                            <label htmlFor="phone">Teléfono</label>
                            <input
                                type="text"
                                id="phone"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="Ej: 0414-1234567"
                            />
                        </div>
                        <div className="form-group half">
                            <label htmlFor="email">Correo Electrónico</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="correo@ejemplo.com"
                            />
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="btn-primary" disabled={saving}>
                            {saving ? 'Guardando...' : 'Guardar Cliente'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CustomerModal;
