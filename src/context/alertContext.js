import { createContext, useContext } from 'react';

export const AlertContext = createContext(null);

export function useAlert() {
    const context = useContext(AlertContext);
    if (!context) {
        throw new Error('useAlert must be used within an AlertProvider');
    }
    return context;
}
