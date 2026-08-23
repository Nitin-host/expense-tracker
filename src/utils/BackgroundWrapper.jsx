import React from 'react';

const BackgroundWrapper = ({ children }) => (
    <div
        className="flex min-h-dvh w-full items-center justify-center bg-cover bg-center bg-scroll p-5
            bg-[radial-gradient(900px_480px_at_10%_0%,rgba(15,118,110,0.28),transparent_55%),linear-gradient(165deg,rgba(15,23,42,0.45),rgba(15,118,110,0.25)),url('/expense-background.avif')]
            dark:bg-[radial-gradient(900px_480px_at_10%_0%,rgba(45,212,191,0.18),transparent_55%),linear-gradient(165deg,rgba(15,23,42,0.82),rgba(15,118,110,0.28)),url('/expense-background.avif')]"
    >
        {children}
    </div>
);

export default BackgroundWrapper;
