import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [subdomain, setSubdomain] = useState('sucursal1'); // Default for dev
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Load token and user from localStorage on init
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        const storedSubdomain = localStorage.getItem('subdomain') || 'sucursal1';

        if (storedToken && storedUser) {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
        }
        setSubdomain(storedSubdomain);
        setLoading(false);
    }, []);

    const login = (accessToken, userData, branchSubdomain = 'sucursal1') => {
        setToken(accessToken);
        setUser(userData);
        setSubdomain(branchSubdomain);
        
        localStorage.setItem('token', accessToken);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('subdomain', branchSubdomain);
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    };

    return (
        <AuthContext.Provider value={{ user, token, subdomain, setSubdomain, login, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};
