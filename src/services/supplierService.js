import { getHeaders, BASE_URL } from './apiUtils';

const API_URL = `${BASE_URL}/suppliers/`;

export const getSuppliers = async () => {
    const response = await fetch(API_URL, { headers: getHeaders() });
    if (!response.ok) throw new Error('Error al obtener proveedores');
    return response.json();
};

export const createSupplier = async (data) => {
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Error al crear proveedor');
    }
    return response.json();
};

export const updateSupplier = async (id, data) => {
    const response = await fetch(`${API_URL}${id}/`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Error al actualizar proveedor');
    }
    return response.json();
};

export const deleteSupplier = async (id) => {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
    });
    if (!response.ok) throw new Error('Error al eliminar proveedor');
    return response.json();
};
