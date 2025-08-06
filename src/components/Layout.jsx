import React, { useState, useEffect } from 'react';
import { Navbar, Button, Nav, Row, Col } from 'react-bootstrap';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/authSlice';
import { FaBars, FaSun, FaMoon } from 'react-icons/fa';
import { RiMenu2Fill } from "react-icons/ri";
import Sidebar from './Sidebar';
import AppBreadcrumbs from './AppBreadcrumbs';
import '../styles/themes.scss'

const Layout = () => {
    // Sidebar expanded state toggled by hamburger button
    const [sidebarExpanded, setSidebarExpanded] = useState(false);

    // Sidebar hover state for temporary expansion
    const [sidebarHovered, setSidebarHovered] = useState(false);

    // Theme state: 'dark' or 'light', defaults to browser preference or saved theme
    // const [theme, setTheme] = useState(() => {
    //     const saved = localStorage.getItem('app-theme');
    //     if (saved === 'dark' || saved === 'light') return saved;
    //     if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)
    //         return 'dark';
    //     return 'light';
    // });

    // Updated: Default to 'light' theme always initially,
    // unless the user explicitly saved a preference.
    const [theme, setTheme] = useState(() => {
        const saved = localStorage.getItem('app-theme');
        return (saved === 'dark' || saved === 'light') ? saved : 'light';
    });

    const [toggleHovered, setToggleHovered] = useState(false);

    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user, isAuthenticated } = useSelector((state) => state.auth);

    // Apply theme class to body and save preference
    useEffect(() => {
        document.body.classList.remove('dark-theme', 'light-theme');
        document.body.classList.add(theme + '-theme');
        localStorage.setItem('app-theme', theme);
    }, [theme]);

    // Listen for OS-level preference change (optional)
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handler = (e) => {
            // Change theme only if user has not explicitly chosen
            if (!localStorage.getItem('app-theme')) {
                setTheme(e.matches ? 'dark' : 'light');
            }
        };
        mediaQuery.addEventListener('change', handler);
        return () => mediaQuery.removeEventListener('change', handler);
    }, []);

    // Toggle theme between dark and light
    const toggleTheme = () => {
        setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
    };

    // Logout handler
    const handleLogout = () => {
        dispatch(logout());
        navigate('/login');
    };

    // Sidebar toggle
    const toggleSidebar = () => setSidebarExpanded((prev) => !prev);

    // Sidebar hover controls
    const handleSidebarMouseEnter = () => {
        if (!sidebarExpanded) setSidebarHovered(true);
    };

    const handleSidebarMouseLeave = () => {
        if (!sidebarExpanded) setSidebarHovered(false);
    };

    // Sidebar open state (expanded if toggled or hovered)
    const isSidebarOpen = sidebarExpanded || sidebarHovered;

    return (
        <div className={`full-app-layout d-flex flex-column ${theme}-theme`} style={{ height: '100vh' }}>
            {/* Navbar */}
            <Navbar
                bg={theme === 'dark' ? 'dark' : 'light'}
                variant={theme === 'dark' ? 'dark' : 'light'}
                expand="md"
                fixed="top"
                className="px-3 navbar"
                style={{ height: 56, zIndex: 1020 }}
            >
                <Row className="align-items-center w-25 px-3">
                    <Col xs={6} md={6}>
                        <Navbar.Brand as={Link} to="/home" className="fw-bold" style={{ letterSpacing: 1 }}>
                            Expense Tracker
                        </Navbar.Brand>
                    </Col>
                    <Col xs={6} md={6} className="text-end">
                        <Button
                            className="icon-toggle-btn me-2"
                            type="button"
                            onClick={toggleSidebar}
                            aria-label="Toggle sidebar"
                            onMouseEnter={() => setToggleHovered(true)}
                            onMouseLeave={() => setToggleHovered(false)}
                        >
                            {toggleHovered ? <FaBars /> : <RiMenu2Fill />}
                        </Button>
                    </Col>
                </Row>

                <Row className="d-none d-md-flex mt-3 w-50">
                    <Col md={12}>
                        <AppBreadcrumbs />
                    </Col>
                </Row>
                <Navbar.Collapse className="justify-content-end">
                    {isAuthenticated && user ? (
                        <>
                            <Navbar.Text className="me-3" aria-label="Current user name">{user.name}</Navbar.Text>
                            <Button variant={theme === 'dark' ? 'outline-light' : 'outline-dark'} size="sm" onClick={handleLogout}>
                                Logout
                            </Button>
                            <Button
                                variant={theme === 'dark' ? 'outline-light' : 'outline-dark'}
                                size="sm"
                                onClick={toggleTheme}
                                className="ms-3"
                                aria-label="Toggle theme"
                                title="Toggle theme"
                            >
                                {theme === 'dark' ? <FaSun /> : <FaMoon />}
                            </Button>
                        </>
                    ) : (
                        <>
                            <Nav.Link as={Link} to="/login" className={theme === 'dark' ? 'text-light' : ''}>
                                Login
                            </Nav.Link>
                            <Nav.Link as={Link} to="/register" className={theme === 'dark' ? 'text-light' : ''}>
                                Register
                            </Nav.Link>
                            <Button
                                variant={theme === 'dark' ? 'outline-light' : 'outline-dark'}
                                size="sm"
                                onClick={toggleTheme}
                                className="ms-3"
                                aria-label="Toggle theme"
                                title="Toggle theme"
                            >
                                {theme === 'dark' ? <FaSun /> : <FaMoon />}
                            </Button>
                        </>
                    )}
                </Navbar.Collapse>
            </Navbar>

            {/* Sidebar and Main Content Container */}
            <div className="app-body">
                <Sidebar
                    expanded={isSidebarOpen}
                    onExpandChange={setSidebarExpanded}
                    onMouseEnter={handleSidebarMouseEnter}
                    onMouseLeave={handleSidebarMouseLeave}
                />
                <main className={`main-content ${isSidebarOpen ? 'sidebar-expanded' : 'sidebar-collapsed'}`} aria-live="polite">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default Layout;