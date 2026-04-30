import React, { useState, useEffect } from 'react';
import { getSuppliers, deleteSupplier } from '../../services/supplierService';
import SupplierModal from '../../components/Suppliers/SupplierModal';
import ConfirmModal from '../../components/ui/ConfirmModal';
import './SuppliersPage.css';

const SuppliersPage = () => {
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [supplierToEdit, setSupplierToEdit] = useState(null);
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null });

    const fetchSuppliers = async () => {
        setLoading(true);
        try {
            const data = await getSuppliers();
            setSuppliers(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSuppliers();
    }, []);

    const handleAdd = () => {
        setSupplierToEdit(null);
        setIsModalOpen(true);
    };

    const handleEdit = (supplier) => {
        setSupplierToEdit(supplier);
        setIsModalOpen(true);
    };

    const handleDelete = (id) => {
        setDeleteModal({ isOpen: true, id });
    };

    const executeDelete = async () => {
        try {
            await deleteSupplier(deleteModal.id);
            fetchSuppliers();
        } catch (error) {
            alert(error.message);
        } finally {
            setDeleteModal({ isOpen: false, id: null });
        }
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <h2>Gestión de Proveedores</h2>
                <button className="btn-primary" onClick={handleAdd}>+ Nuevo Proveedor</button>
            </div>

            {loading ? (
                <div className="loading">Cargando proveedores...</div>
            ) : (
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>RIF</th>
                                <th>Nombre</th>
                                <th>Teléfono</th>
                                <th>Dirección</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {suppliers.length === 0 ? (
                                <tr><td colSpan="5" className="no-data">No hay proveedores registrados.</td></tr>
                            ) : (
                                suppliers.map(s => (
                                    <tr key={s.id}>
                                        <td>{s.rif}</td>
                                        <td>{s.name}</td>
                                        <td>{s.phone || '-'}</td>
                                        <td>{s.address || '-'}</td>
                                        <td className="actions-cell">
                                            <button className="btn-edit" onClick={() => handleEdit(s)}>Editar</button>
                                            <button className="btn-delete" onClick={() => handleDelete(s.id)}>Eliminar</button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {isModalOpen && (
                <SupplierModal 
                    supplier={supplierToEdit} 
                    onClose={() => setIsModalOpen(false)} 
                    onSave={() => { setIsModalOpen(false); fetchSuppliers(); }} 
                />
            )}

            <ConfirmModal 
                isOpen={deleteModal.isOpen}
                title="Eliminar Proveedor"
                message="¿Estás seguro de que deseas eliminar este proveedor?"
                onConfirm={executeDelete}
                onCancel={() => setDeleteModal({ isOpen: false, id: null })}
            />
        </div>
    );
};

export default SuppliersPage;
