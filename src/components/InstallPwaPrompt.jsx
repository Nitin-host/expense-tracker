import React, { useEffect, useState } from 'react';

export default function InstallPwaPrompt() {
    const [deferred, setDeferred] = useState(null);
    const [dismissed, setDismissed] = useState(
        () => localStorage.getItem('pwa-install-dismissed') === '1'
    );

    useEffect(() => {
        const onBeforeInstall = (e) => {
            e.preventDefault();
            setDeferred(e);
        };
        window.addEventListener('beforeinstallprompt', onBeforeInstall);
        return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall);
    }, []);

    if (dismissed || !deferred) return null;

    const install = async () => {
        deferred.prompt();
        await deferred.userChoice;
        setDeferred(null);
    };

    const dismiss = () => {
        localStorage.setItem('pwa-install-dismissed', '1');
        setDismissed(true);
        setDeferred(null);
    };

    return (
        <div
            className="fixed bottom-20 left-3 right-3 z-[1050] mx-auto flex max-w-md items-center justify-between gap-3 rounded-2xl border border-slate-900/10 bg-white/95 px-4 py-3 shadow-lg backdrop-blur-md dark:border-slate-400/15 dark:bg-slate-900/95 md:bottom-4 md:left-auto md:right-4"
            role="dialog"
            aria-label="Install app"
        >
            <div>
                <p className="mb-0 text-sm font-semibold text-slate-900 dark:text-slate-100">Install Expense Tracker</p>
                <p className="mb-0 text-xs text-muted">Add to home screen for quick access.</p>
            </div>
            <div className="flex shrink-0 gap-2">
                <button type="button" className="btn btn-sm btn-outline-secondary" onClick={dismiss}>
                    Later
                </button>
                <button type="button" className="btn btn-sm btn-primary touch-btn" onClick={install}>
                    Install
                </button>
            </div>
        </div>
    );
}
