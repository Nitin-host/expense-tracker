import React, { Suspense, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/authSlice';
import { FaBars, FaSun, FaMoon, FaChevronLeft, FaSignOutAlt } from 'react-icons/fa';
import { Modal, Button } from './ui';
import Sidebar from './Sidebar';
import MobileBottomNav from './MobileBottomNav';
import AppBreadcrumbs from './AppBreadcrumbs';
import { PageRouteSkeleton } from './Skeleton';
import { ThemeContext } from '../utils/ThemeContext';
import api from '../api/http';

const MOBILE_MQ = '(max-width: 767.98px)';

function getInitials(name = '') {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return 'U';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function getMobileTitle(pathname) {
    if (pathname.startsWith('/home')) return 'Home';
    if (pathname === '/solution' || pathname === '/solution/') return 'Solutions';
    if (pathname.includes('/dashboard')) return 'Dashboard';
    if (pathname.includes('/collected-cash')) return 'Collected Cash';
    if (pathname.includes('/expense-data')) return 'Expenses';
    if (pathname.includes('/reports')) return 'Reports';
    if (pathname.startsWith('/solution/')) return 'Solution';
    return 'Expense Tracker';
}

const Layout = () => {
    const [sidebarExpanded, setSidebarExpanded] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(
        typeof window !== 'undefined' ? window.matchMedia(MOBILE_MQ).matches : false
    );
    const userMenuRef = useRef(null);

    const { theme, toggleTheme } = useContext(ThemeContext);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const { user, isAuthenticated, refreshToken } = useSelector((state) => state.auth);

    const mobileTitle = useMemo(() => getMobileTitle(location.pathname), [location.pathname]);

    useEffect(() => {
        const mq = window.matchMedia(MOBILE_MQ);
        const onChange = (e) => setIsMobile(e.matches);
        mq.addEventListener('change', onChange);
        return () => mq.removeEventListener('change', onChange);
    }, []);

    useEffect(() => {
        setUserMenuOpen(false);
    }, [location.pathname]);

    useEffect(() => {
        if (!userMenuOpen) return undefined;

        const onPointerDown = (event) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
                setUserMenuOpen(false);
            }
        };
        const onEscape = (event) => {
            if (event.key === 'Escape') setUserMenuOpen(false);
        };

        document.addEventListener('mousedown', onPointerDown);
        document.addEventListener('keydown', onEscape);
        return () => {
            document.removeEventListener('mousedown', onPointerDown);
            document.removeEventListener('keydown', onEscape);
        };
    }, [userMenuOpen]);

    const handleLogout = async () => {
        try {
            await api.post('/logout', { refreshToken });
        } catch {
            /* ignore */
        }
        dispatch(logout());
        navigate('/login');
    };

    return (
        <div className={`full-app-layout d-flex flex-column ${theme}-theme`}>
            <header className={`app-navbar ${isMobile ? 'app-navbar--mobile' : ''}`}>
                {isMobile ? (
                    <div className="mobile-topbar">
                        <Link to="/home" className="mobile-topbar__brand">
                            <span className="mobile-topbar__mark" aria-hidden />
                            <div className="mobile-topbar__text">
                                <span className="mobile-topbar__app">Expense Tracker</span>
                                <span className="mobile-topbar__page">{mobileTitle}</span>
                            </div>
                        </Link>
                        <div className="mobile-topbar__actions">
                            <button
                                type="button"
                                className="mobile-topbar__icon-btn"
                                onClick={toggleTheme}
                                aria-label="Toggle theme"
                            >
                                {theme === 'dark' ? <FaSun /> : <FaMoon />}
                            </button>
                            <button
                                type="button"
                                className="mobile-topbar__icon-btn mobile-topbar__icon-btn--danger"
                                onClick={() => setShowLogoutModal(true)}
                                aria-label="Logout"
                            >
                                <FaSignOutAlt />
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="app-topbar">
                        <div className="app-topbar__start">
                            <button
                                className="app-topbar__menu-btn"
                                type="button"
                                onClick={() => setSidebarExpanded((prev) => !prev)}
                                aria-label={sidebarExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
                                aria-expanded={sidebarExpanded}
                            >
                                {sidebarExpanded ? <FaChevronLeft /> : <FaBars />}
                            </button>

                            <Link to="/home" className="app-topbar__brand">
                                <span className="app-topbar__mark" aria-hidden />
                                <span className="app-topbar__brand-name">Expense Tracker</span>
                            </Link>
                        </div>

                        <div className="app-topbar__divider" aria-hidden />

                        <div className="app-topbar__center">
                            <AppBreadcrumbs theme={theme} />
                        </div>

                        <div className="app-topbar__end">
                            {isAuthenticated && user ? (
                                <>
                                    <button
                                        type="button"
                                        className="app-topbar__theme-btn"
                                        onClick={toggleTheme}
                                        aria-label="Toggle theme"
                                        title="Toggle theme"
                                    >
                                        {theme === 'dark' ? <FaSun /> : <FaMoon />}
                                    </button>

                                    <div className="app-topbar__user-menu" ref={userMenuRef}>
                                        <button
                                            type="button"
                                            className={`app-topbar__user-trigger${userMenuOpen ? ' is-open' : ''}`}
                                            onClick={() => setUserMenuOpen((open) => !open)}
                                            aria-expanded={userMenuOpen}
                                            aria-haspopup="menu"
                                        >
                                            <span className="app-topbar__avatar" aria-hidden>
                                                {getInitials(user.name)}
                                            </span>
                                            <span className="app-topbar__user-text">
                                                <span className="app-topbar__name">{user.name}</span>
                                                <span className="app-topbar__role">
                                                    {user.role?.replace('_', ' ')}
                                                </span>
                                            </span>
                                        </button>

                                        {userMenuOpen && (
                                            <div className="app-topbar__dropdown" role="menu">
                                                <div className="app-topbar__dropdown-head">
                                                    <span className="app-topbar__dropdown-name">{user.name}</span>
                                                    <span className="app-topbar__dropdown-role">
                                                        {user.role?.replace('_', ' ')}
                                                    </span>
                                                </div>
                                                <button
                                                    type="button"
                                                    className="app-topbar__dropdown-item app-topbar__dropdown-item--danger"
                                                    role="menuitem"
                                                    onClick={() => {
                                                        setUserMenuOpen(false);
                                                        setShowLogoutModal(true);
                                                    }}
                                                >
                                                    <FaSignOutAlt aria-hidden />
                                                    Log out
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <Link to="/login" className="app-topbar__login-link">
                                    Sign in
                                </Link>
                            )}
                        </div>
                    </div>
                )}
            </header>

            <div className={`app-body ${isMobile ? 'is-mobile' : ''}`}>
                {!isMobile && (
                    <Sidebar
                        expanded={sidebarExpanded}
                        onNavigate={() => {}}
                        onRequestExpand={() => setSidebarExpanded(true)}
                    />
                )}

                <main
                    className={`main-content ${
                        isMobile
                            ? 'sidebar-hidden has-bottom-nav'
                            : sidebarExpanded
                              ? 'sidebar-expanded'
                              : 'sidebar-collapsed'
                    }`}
                    aria-live="polite"
                >
                    <Suspense fallback={<PageRouteSkeleton pathname={location.pathname} />}>
                        <Outlet />
                    </Suspense>
                </main>

                {isMobile && <MobileBottomNav />}
            </div>

            <Modal show={showLogoutModal} onHide={() => setShowLogoutModal(false)} centered size="sm">
                <Modal.Header closeButton>
                    <Modal.Title>Log out?</Modal.Title>
                </Modal.Header>
                <Modal.Body>You will need to sign in again to access your solutions.</Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowLogoutModal(false)}>
                        Cancel
                    </Button>
                    <Button
                        variant="danger"
                        onClick={() => {
                            setShowLogoutModal(false);
                            handleLogout();
                        }}
                    >
                        Logout
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default Layout;
