import React, { createContext, useState, useContext, useEffect } from 'react';

const BillingContext = createContext();

export const BillingProvider = ({ children }) => {
    const [cart, setCart] = useState(() => {
        const saved = localStorage.getItem('billing_cart');
        return saved ? JSON.parse(saved) : [];
    });
    
    const [selectedCustomer, setSelectedCustomer] = useState(() => {
        const saved = localStorage.getItem('billing_customer');
        return saved ? JSON.parse(saved) : null;
    });

    const [currency, setCurrency] = useState('VES');
    const [paymentMethod, setPaymentMethod] = useState('TRANSFERENCIA');

    useEffect(() => {
        localStorage.setItem('billing_cart', JSON.stringify(cart));
    }, [cart]);

    useEffect(() => {
        localStorage.setItem('billing_customer', JSON.stringify(selectedCustomer));
    }, [selectedCustomer]);

    const clearBilling = () => {
        setCart([]);
        setSelectedCustomer(null);
        localStorage.removeItem('billing_cart');
        localStorage.removeItem('billing_customer');
    };

    return (
        <BillingContext.Provider value={{ 
            cart, setCart, 
            selectedCustomer, setSelectedCustomer,
            currency, setCurrency,
            paymentMethod, setPaymentMethod,
            clearBilling
        }}>
            {children}
        </BillingContext.Provider>
    );
};

export const useBilling = () => useContext(BillingContext);
