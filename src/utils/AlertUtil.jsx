import React, { useState, useEffect, createContext, useContext } from 'react';
import { Alert } from 'react-bootstrap';

const AlertContext = createContext(null);

export function AlertProvider({ children }) {
    const [alert, setAlert] = useState({ show: false, message: '', variant: 'success' });

    useEffect(() => {
        if (alert.show) {
            const timer = setTimeout(() => {
                setAlert(prev => ({ ...prev, show: false }));
            }, 3500);
            return () => clearTimeout(timer);
        }
    }, [alert.show]);

    // Main notify
    const notify = (message, variant = 'success') => {
        setAlert({ show: true, message, variant });
    };

    // Variants
    const notifySuccess = (msg) => notify(msg, 'success');
    const notifyError = (msg) => notify(msg, 'danger');
    const notifyWarning = (msg) => notify(msg, 'warning');
    const notifyInfo = (msg) => notify(msg, 'info');

    return (
        <AlertContext.Provider value={{ notifySuccess, notifyError, notifyWarning, notifyInfo }}>
            {children}
            {alert.show && (
                <Alert
                    variant={alert.variant}
                    dismissible
                    onClose={() => setAlert(prev => ({ ...prev, show: false }))}
                    className="position-fixed bottom-0 start-50 translate-middle-x mb-3"
                    style={{ zIndex: 1060, minWidth: '280px', maxWidth: '90vw' }}
                >
                    {alert.message}
                </Alert>
            )}
        </AlertContext.Provider>
    );
}

export const useAlert = () => {
    const context = useContext(AlertContext);
    if (!context) {
        throw new Error('useAlert must be used within an AlertProvider');
    }
    return context;
};
