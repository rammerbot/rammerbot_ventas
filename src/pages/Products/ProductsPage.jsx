import React, { useState, useEffect } from 'react';
import { getProducts, deleteProduct } from '../../services/productService';
import ProductModal from '../../components/Products/ProductModal';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { useAuth } from '../../context/AuthContext';
import './ProductsPage.css';

const ProductsPage = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [productToEdit, setProductToEdit] = useState(null);
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null, stock: 0 });
    
    const { user } = useAuth();
    const isAdmin = user?.role === 'ADMINISTRADOR';

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const data = await getProducts();
            setProducts(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleAdd = () => {
        setProductToEdit(null);
        setIsModalOpen(true);
    };

    const handleEdit = (product) => {
        if (!isAdmin) {
            alert("Solo los administradores pueden editar productos.");
            return;
        }
        setProductToEdit(product);
        setIsModalOpen(true);
    };

    const handleDelete = (product) => {
        if (!isAdmin) {
            alert("Solo los administradores pueden eliminar productos.");
            return;
        }
        if (product.stock > 0) {
            alert("No se puede eliminar un producto con stock mayor a cero.");
            return;
        }
        setDeleteModal({ isOpen: true, id: product.id, stock: product.stock });
    };

    const executeDelete = async () => {
        try {
            await deleteProduct(deleteModal.id);
            fetchProducts();
        } catch (error) {
            alert(error.message);
        } finally {
            setDeleteModal({ isOpen: false, id: null, stock: 0 });
        }
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <h2>Catálogo de Productos</h2>
                <button className="btn-primary" onClick={handleAdd}>+ Nuevo Producto</button>
            </div>

            {loading ? (
                <div className="loading">Cargando productos...</div>
            ) : (
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Código</th>
                                <th>Nombre</th>
                                <th>Precio Compra</th>
                                <th>Precio Venta</th>
                                <th>Existencia</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.length === 0 ? (
                                <tr><td colSpan="6" className="no-data">No hay productos registrados.</td></tr>
                            ) : (
                                products.map(p => (
                                    <tr key={p.id}>
                                        <td>{p.code}</td>
                                        <td>{p.name}</td>
                                        <td>${p.price_buy.toFixed(2)}</td>
                                        <td>${p.price_sell.toFixed(2)}</td>
                                        <td className={p.stock <= 0 ? 'text-danger' : ''}>
                                            <strong>{p.stock}</strong>
                                        </td>
                                        <td className="actions-cell">
                                            <button className="btn-edit" onClick={() => handleEdit(p)}>Editar</button>
                                            <button className="btn-delete" onClick={() => handleDelete(p)}>Eliminar</button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {isModalOpen && (
                <ProductModal 
                    product={productToEdit} 
                    onClose={() => setIsModalOpen(false)} 
                    onSave={() => { setIsModalOpen(false); fetchProducts(); }} 
                />
            )}

            <ConfirmModal 
                isOpen={deleteModal.isOpen}
                title="Eliminar Producto"
                message="¿Estás seguro de que deseas eliminar este producto?"
                onConfirm={executeDelete}
                onCancel={() => setDeleteModal({ isOpen: false, id: null, stock: 0 })}
            />
        </div>
    );
};

export default ProductsPage;
