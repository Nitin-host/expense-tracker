import React from 'react';
import { Button } from './ui';

export default function RouteErrorFallback({
    title = 'Something went wrong',
    message = 'This page failed to load. This can happen after an app update — try reloading.',
    onRetry,
    compact = false,
}) {
    const handleReload = () => {
        if (typeof onRetry === 'function') {
            onRetry();
            return;
        }
        window.location.reload();
    };

    return (
        <div
            className={`route-error-fallback${compact ? ' route-error-fallback--compact' : ''}`}
            role="alert"
        >
            <div className="route-error-fallback__icon" aria-hidden>
                !
            </div>
            <h2 className="route-error-fallback__title">{title}</h2>
            <p className="route-error-fallback__message">{message}</p>
            <div className="route-error-fallback__actions">
                <Button variant="primary" className="touch-btn" onClick={handleReload}>
                    Reload page
                </Button>
                <Button
                    variant="outline-secondary"
                    className="touch-btn"
                    onClick={() => {
                        window.location.href = '/home';
                    }}
                >
                    Go to Home
                </Button>
            </div>
        </div>
    );
}
