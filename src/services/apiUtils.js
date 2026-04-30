export const getHeaders = () => {
    const token = localStorage.getItem('token');
    const subdomain = localStorage.getItem('subdomain') || 'sucursal1';
    
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
        'X-Branch-Subdomain': subdomain
    };
};

export const BASE_URL = 'http://localhost:8000/api/v1';
