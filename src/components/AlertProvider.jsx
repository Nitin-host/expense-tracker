import React, { useCallback, useEffect, useMemo, useState } from 'react';
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

    const notify = useCallback((message, variant = 'success') => {
        setAlert({ show: true, message, variant });
    }, []);

    const notifySuccess = useCallback((msg) => notify(msg, 'success'), [notify]);
    const notifyError = useCallback((msg) => notify(msg, 'danger'), [notify]);
    const notifyWarning = useCallback((msg) => notify(msg, 'warning'), [notify]);
    const notifyInfo = useCallback((msg) => notify(msg, 'info'), [notify]);

    const value = useMemo(
        () => ({ notifySuccess, notifyError, notifyWarning, notifyInfo }),
        [notifySuccess, notifyError, notifyWarning, notifyInfo]
    );

    return (
        <AlertContext.Provider value={value}>
            {children}
            {alert.show ? (
                <Alert
                    variant={alert.variant}
                    dismissible
                    onClose={() => setAlert((prev) => ({ ...prev, show: false }))}
                    className="et-alert-toast"
                >
                    {alert.message}
                </Alert>
            ) : null}
        </AlertContext.Provider>
    );
}
