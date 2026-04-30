import { getHeaders, BASE_URL } from './apiUtils';

const API_URL = `${BASE_URL}/customers/`;

export const getCustomers = async () => {
    const response = await fetch(API_URL, {
        headers: getHeaders()
    });
    if (!response.ok) {
        if (response.status === 401) throw new Error('No autenticado');
        throw new Error('Error al obtener clientes');
    }
    return response.json();
};

export const getCustomer = async (id) => {
    const response = await fetch(`${API_URL}${id}/`, {
        headers: getHeaders()
    });
    if (!response.ok) {
        throw new Error('Error al obtener cliente');
    }
    return response.json();
};

export const createCustomer = async (customerData) => {
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(customerData),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al crear cliente');
    }
    return response.json();
};

export const updateCustomer = async (id, customerData) => {
    const response = await fetch(`${API_URL}${id}/`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(customerData),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al actualizar cliente');
    }
    return response.json();
};

export const deleteCustomer = async (id) => {
    const response = await fetch(`${API_URL}${id}/`, {
        method: 'DELETE',
        headers: getHeaders()
    });
    if (!response.ok) {
        throw new Error('Error al eliminar cliente');
    }
    return response.json();
};
