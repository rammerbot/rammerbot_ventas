import { getHeaders, BASE_URL } from './apiUtils';

const API_URL = `${BASE_URL}/invoices/`;

export const getFiscalSettings = async () => {
    const response = await fetch(`${API_URL}settings/`, { headers: getHeaders() });
    if (!response.ok) throw new Error('Error al obtener configuración fiscal');
    return response.json();
};

export const updateUSDRate = async (rate) => {
    const response = await fetch(`${API_URL}settings/usd-rate/`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ rate }),
    });
    if (!response.ok) throw new Error('Error al actualizar tasa USD');
    return response.json();
};

export const createInvoice = async (invoiceData) => {
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(invoiceData),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Error al emitir factura');
    }
    return response.json();
};

export const getInvoices = async () => {
    const response = await fetch(API_URL, { headers: getHeaders() });
    if (!response.ok) throw new Error('Error al obtener facturas');
    return response.json();
};

export const fetchBCVRate = async () => {
    try {
        // Public API for Venezuelan exchange rates
        const response = await fetch('https://ve.dolarapi.com/v1/dolares/bcv');
        if (!response.ok) throw new Error('Error fetching rate');
        const data = await response.json();
        return data.price;
    } catch (error) {
        console.error("Could not fetch BCV rate automatically", error);
        return null;
    }
};
