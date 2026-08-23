import React from 'react';
import { useLocation } from 'react-router-dom';

export function SkeletonPulse({ className = '', style }) {
    return <span className={`sk-pulse ${className}`} style={style} aria-hidden />;
}

export function SkeletonPageHeader({ actionCount = 1 }) {
    return (
        <div className="page-header">
            <div>
                <SkeletonPulse className="sk-line sk-line--title" />
                <SkeletonPulse className="sk-line sk-line--sub mt-2" />
            </div>
            {actionCount > 0 && (
                <div className="d-flex flex-wrap gap-2">
                    {Array.from({ length: actionCount }).map((_, i) => (
                        <SkeletonPulse
                            key={i}
                            className="sk-btn"
                            style={{ width: actionCount > 2 ? 100 : 110 }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export function SkeletonStatGrid({ count = 3 }) {
    return (
        <div className="row g-3 mb-4">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="col-12 col-md-4">
                    <div className="stat-tile">
                        <SkeletonPulse className="sk-line sk-line--label" />
                        <SkeletonPulse className="sk-line sk-line--stat mt-3" />
                    </div>
                </div>
            ))}
        </div>
    );
}

export function SkeletonFilterRow({ cols = 2 }) {
    return (
        <div className="row g-3 mb-3">
            {Array.from({ length: cols }).map((_, i) => (
                <div key={i} className="col-6 col-md-3">
                    <SkeletonPulse className="sk-line sk-line--label mb-2" style={{ width: 56 }} />
                    <SkeletonPulse className="sk-input" />
                </div>
            ))}
        </div>
    );
}

function SkeletonMobileDataCard({ withActions = true }) {
    return (
        <article className="mobile-data-card sk-mobile-card" aria-hidden>
            <div className="mobile-data-card__accent sk-mobile-card__accent" />
            <div className="mobile-data-card__body">
                <SkeletonPulse className="sk-line sk-line--card-title" />
                <div className="sk-mobile-card__metrics">
                    <SkeletonPulse className="sk-mobile-card__metric-block" />
                    <SkeletonPulse className="sk-mobile-card__metric-block" />
                    <SkeletonPulse className="sk-mobile-card__metric-block" />
                </div>
                <div className="sk-mobile-card__details">
                    <SkeletonPulse className="sk-line sk-line--detail" />
                    <SkeletonPulse className="sk-line sk-line--detail" style={{ width: '75%' }} />
                </div>
            </div>
            {withActions && (
                <footer className="mobile-data-card__actions">
                    <SkeletonPulse className="sk-action" />
                    <SkeletonPulse className="sk-action" />
                </footer>
            )}
        </article>
    );
}

export function SkeletonTableCards({ count = 4, withActions = true }) {
    return (
        <div className="mobile-data-card-list sk-table-cards" aria-busy="true" aria-label="Loading">
            {Array.from({ length: count }).map((_, i) => (
                <SkeletonMobileDataCard key={i} withActions={withActions} />
            ))}
        </div>
    );
}

function SkeletonTableSurface({ cardCount = 4, withActions = true }) {
    return (
        <div className="table-util-wrap page-surface overflow-hidden">
            <div className="sk-table-toolbar">
                <SkeletonPulse className="sk-line sk-line--table-name" />
                <SkeletonPulse className="sk-search" />
            </div>
            <SkeletonTableCards count={cardCount} withActions={withActions} />
        </div>
    );
}

export function SkeletonCards({ count = 4 }) {
    return (
        <div className="solution-grid">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="page-surface sk-solution-card h-100">
                    <div className="d-flex justify-content-between gap-2">
                        <SkeletonPulse className="sk-line sk-line--card-title" />
                        <SkeletonPulse className="sk-avatar" />
                    </div>
                    <SkeletonPulse className="sk-chip mt-2" />
                    <SkeletonPulse className="sk-line sk-line--detail mt-3" />
                    <SkeletonPulse className="sk-line sk-line--detail mt-2" style={{ width: '80%' }} />
                    <div className="d-flex gap-2 mt-3">
                        <SkeletonPulse className="sk-btn-sm" />
                        <SkeletonPulse className="sk-btn-sm" />
                    </div>
                </div>
            ))}
        </div>
    );
}

export function SkeletonDashboard() {
    return (
        <div className="dashboard-page page-shell" aria-busy="true" aria-label="Loading dashboard">
            <SkeletonPageHeader actionCount={0} />
            <div className="dashboard-stats dashboard-stats--primary">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="stat-tile stat-tile--compact">
                        <SkeletonPulse className="sk-line sk-line--label mb-2" style={{ width: '55%' }} />
                        <SkeletonPulse className="sk-line" style={{ width: '70%', height: '1.6rem' }} />
                    </div>
                ))}
            </div>
            <div className="dashboard-body">
                <div className="dashboard-charts">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="page-surface dashboard-chart-card">
                            <SkeletonPulse className="sk-line sk-line--label mb-2" style={{ width: 140 }} />
                            <SkeletonPulse className="sk-chart mx-auto my-2" />
                        </div>
                    ))}
                </div>
                <div className="dashboard-activity">
                    {Array.from({ length: 2 }).map((_, i) => (
                        <div key={i} className="page-surface dashboard-activity-card">
                            <SkeletonPulse className="sk-line sk-line--label mb-3" style={{ width: 130 }} />
                            {Array.from({ length: 3 }).map((__, j) => (
                                <div key={j} className="sk-recent-row">
                                    <SkeletonPulse className="sk-line" style={{ width: '50%' }} />
                                    <SkeletonPulse className="sk-line" style={{ width: '30%' }} />
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export function SkeletonReportsPage() {
    return (
        <div className="page-shell py-2" aria-busy="true" aria-label="Loading reports">
            <SkeletonPageHeader actionCount={3} />
            <SkeletonFilterRow cols={2} />
            <SkeletonStatGrid count={3} />
            <div className="page-surface mb-4">
                <SkeletonPulse className="sk-line sk-line--label mb-3" style={{ width: 140 }} />
                <SkeletonTableCards count={2} withActions={false} />
            </div>
            <div className="page-surface">
                <SkeletonPulse className="sk-line sk-line--label mb-3" style={{ width: 180 }} />
                <SkeletonTableCards count={3} withActions={false} />
            </div>
        </div>
    );
}

export function SkeletonSolutionsPage() {
    return (
        <div className="page-shell py-2" aria-busy="true" aria-label="Loading solutions">
            <SkeletonPageHeader actionCount={1} />
            <SkeletonCards count={4} />
        </div>
    );
}

export function SkeletonTablePage() {
    return (
        <div className="page-shell" aria-busy="true" aria-label="Loading">
            <SkeletonPageHeader actionCount={2} />
            <SkeletonTableSurface cardCount={4} />
        </div>
    );
}

export function SkeletonUsersPage() {
    return (
        <div className="page-shell my-2" aria-busy="true" aria-label="Loading users">
            <SkeletonPageHeader actionCount={1} />
            <SkeletonTableSurface cardCount={4} />
        </div>
    );
}

export function SkeletonHomePage() {
    return (
        <div className="page-shell py-5" aria-busy="true" aria-label="Loading home">
            <div className="row g-4 align-items-center flex-column-reverse flex-md-row">
                <div className="col-12 col-md-6">
                    <div className="page-surface p-4 p-md-5">
                        <SkeletonPulse className="sk-line sk-line--label" style={{ width: 120 }} />
                        <SkeletonPulse className="sk-line sk-line--hero mt-3" />
                        <SkeletonPulse className="sk-line sk-line--hero mt-2" style={{ width: '85%' }} />
                        <SkeletonPulse className="sk-line sk-line--sub mt-4" />
                        <SkeletonPulse className="sk-line sk-line--sub mt-2" style={{ width: '90%' }} />
                        <SkeletonPulse className="sk-btn mt-4" style={{ width: 160 }} />
                    </div>
                </div>
                <div className="col-12 col-md-6">
                    <SkeletonPulse className="sk-hero-image" />
                </div>
            </div>
        </div>
    );
}

export function getSkeletonVariantForPath(pathname = '') {
    if (pathname.startsWith('/home')) return 'home';
    if (pathname === '/solution' || pathname === '/solution/') return 'solutions';
    if (pathname.includes('/dashboard')) return 'dashboard';
    if (pathname.includes('/reports')) return 'reports';
    if (pathname.startsWith('/create-user')) return 'users';
    if (pathname.includes('/collected-cash') || pathname.includes('/expense-data')) return 'table';
    return 'table';
}

export function PageRouteSkeleton({ pathname: pathnameProp }) {
    const location = useLocation();
    const pathname = pathnameProp || location.pathname;
    const variant = getSkeletonVariantForPath(pathname);

    switch (variant) {
        case 'home':
            return <SkeletonHomePage />;
        case 'solutions':
            return <SkeletonSolutionsPage />;
        case 'dashboard':
            return <SkeletonDashboard />;
        case 'reports':
            return <SkeletonReportsPage />;
        case 'users':
            return <SkeletonUsersPage />;
        default:
            return <SkeletonTablePage />;
    }
}

export default function Skeleton({ variant = 'table-page' }) {
    if (variant === 'dashboard') return <SkeletonDashboard />;
    if (variant === 'reports') return <SkeletonReportsPage />;
    if (variant === 'solutions') return <SkeletonSolutionsPage />;
    if (variant === 'home') return <SkeletonHomePage />;
    if (variant === 'users') return <SkeletonUsersPage />;
    if (variant === 'cards') return <SkeletonCards />;
    if (variant === 'table-cards') return <SkeletonTableCards />;
    return <SkeletonTablePage />;
}
