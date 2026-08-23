import React, { useEffect, useState } from 'react';
import { AlertContext } from '../context/alertContext';
import { Alert } from './ui';

export default function AlertProvider({ children }) {
    const [alert, setAlert] = useState({ show: false, message: '', variant: 'success' });

    useEffect(() => {
        if (!alert.show) return undefined;
        const timer = setTimeout(() => {
            setAlert((prev) => ({ ...prev, show: false }));
        }, 3500);
        return () => clearTimeout(timer);
    }, [alert.show]);

    const notify = (message, variant = 'success') => {
        setAlert({ show: true, message, variant });
    };

    const value = {
        notifySuccess: (msg) => notify(msg, 'success'),
        notifyError: (msg) => notify(msg, 'danger'),
        notifyWarning: (msg) => notify(msg, 'warning'),
        notifyInfo: (msg) => notify(msg, 'info'),
    };

    return (
        <AlertContext.Provider value={value}>
            {children}
            {alert.show ? (
                <Alert
                    variant={alert.variant}
                    dismissible
                    onClose={() => setAlert((prev) => ({ ...prev, show: false }))}
                    className="position-fixed bottom-0 start-50 translate-middle-x mb-3"
                    style={{ zIndex: 1200, minWidth: '280px', maxWidth: '90vw' }}
                >
                    {alert.message}
                </Alert>
            ) : null}
        </AlertContext.Provider>
    );
}
