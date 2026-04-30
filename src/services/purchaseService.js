import { getHeaders, BASE_URL } from './apiUtils';

const API_URL = `${BASE_URL}/purchases/`;

export const getPurchases = async () => {
    const response = await fetch(API_URL, { headers: getHeaders() });
    if (!response.ok) throw new Error('Error al obtener compras');
    return response.json();
};

export const createPurchase = async (data) => {
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Error al registrar compra');
    }
    return response.json();
};
