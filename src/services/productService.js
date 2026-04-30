import { getHeaders, BASE_URL } from './apiUtils';

const API_URL = `${BASE_URL}/products/`;

export const getProducts = async () => {
    const response = await fetch(API_URL, { headers: getHeaders() });
    if (!response.ok) throw new Error('Error al obtener productos');
    return response.json();
};

export const createProduct = async (data) => {
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Error al crear producto');
    }
    return response.json();
};

export const updateProduct = async (id, data) => {
    const response = await fetch(`${API_URL}${id}/`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Error al actualizar producto');
    }
    return response.json();
};

export const deleteProduct = async (id) => {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Error al eliminar producto');
    }
    return response.json();
};
