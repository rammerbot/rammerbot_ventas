import React, { useState, useEffect } from 'react';
import './CustomersPage.css';
import { getCustomers, deleteCustomer } from '../../services/customerService';
import CustomerModal from '../../components/Customers/CustomerModal';
import ConfirmModal from '../../components/ui/ConfirmModal';

const CustomersPage = () => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [customerToEdit, setCustomerToEdit] = useState(null);
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, customerId: null });

    const fetchCustomers = async () => {
        setLoading(true);
        try {
            const data = await getCustomers();
            setCustomers(data);
        } catch (error) {
            console.error('Error fetching customers:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, []);

    const handleAddCustomer = () => {
        setCustomerToEdit(null);
        setIsModalOpen(true);
    };

    const handleEditCustomer = (customer) => {
        setCustomerToEdit(customer);
        setIsModalOpen(true);
    };

    const confirmDelete = (id) => {
        setDeleteModal({ isOpen: true, customerId: id });
    };

    const executeDelete = async () => {
        const id = deleteModal.customerId;
        setDeleteModal({ isOpen: false, customerId: null });
        try {
            await deleteCustomer(id);
            fetchCustomers();
        } catch (error) {
            alert(error.message);
        }
    };

    const cancelDelete = () => {
        setDeleteModal({ isOpen: false, customerId: null });
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCustomerToEdit(null);
    };

    const handleSaveSuccess = () => {
        handleCloseModal();
        fetchCustomers();
    };

    return (
        <div className="customers-page">
            <div className="customers-header">
                <h2>Directorio de Clientes</h2>
                <button className="btn-primary" onClick={handleAddCustomer}>
                    + Nuevo Cliente
                </button>
            </div>

            {loading ? (
                <div className="loading">Cargando clientes...</div>
            ) : (
                <div className="table-container">
                    <table className="customers-table">
                        <thead>
                            <tr>
                                <th>Documento</th>
                                <th>Nombre/Razón Social</th>
                                <th>Tipo</th>
                                <th>Teléfono</th>
                                <th>Correo</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {customers.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="no-data">No hay clientes registrados.</td>
                                </tr>
                            ) : (
                                customers.map(customer => (
                                    <tr key={customer.id}>
                                        <td>{customer.document_id}</td>
                                        <td>{customer.name}</td>
                                        <td>{customer.customer_type}</td>
                                        <td>{customer.phone || '-'}</td>
                                        <td>{customer.email || '-'}</td>
                                        <td className="actions-cell">
                                            <button className="btn-edit" onClick={() => handleEditCustomer(customer)}>Editar</button>
                                            <button className="btn-delete" onClick={() => confirmDelete(customer.id)}>Eliminar</button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {isModalOpen && (
                <CustomerModal
                    customer={customerToEdit}
                    onClose={handleCloseModal}
                    onSave={handleSaveSuccess}
                />
            )}

            <ConfirmModal 
                isOpen={deleteModal.isOpen}
                title="Eliminar Cliente"
                message="¿Estás seguro de que deseas eliminar este cliente? Esta acción no se puede deshacer."
                onConfirm={executeDelete}
                onCancel={cancelDelete}
            />
        </div>
    );
};

export default CustomersPage;
