import React, { useState, useContext } from 'react';
import { Navbar, Button, Nav, Row, Col } from 'react-bootstrap';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/authSlice';
import { FaBars, FaSun, FaMoon } from 'react-icons/fa';
import { RiMenu2Fill } from "react-icons/ri";
import Sidebar from './Sidebar';
import AppBreadcrumbs from './AppBreadcrumbs';
import { ThemeContext } from '../utils/ThemeContext';
import '../styles/themes.scss';

const Layout = () => {
    const [sidebarExpanded, setSidebarExpanded] = useState(false);
    const [sidebarHovered, setSidebarHovered] = useState(false);
    const [toggleHovered, setToggleHovered] = useState(false);

    const { theme, toggleTheme } = useContext(ThemeContext);

    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user, isAuthenticated } = useSelector((state) => state.auth);

    const handleLogout = () => {
        dispatch(logout());
        navigate('/login');
    };

    const toggleSidebar = () => setSidebarExpanded((prev) => !prev);
    const handleSidebarMouseEnter = () => {
        if (!sidebarExpanded) setSidebarHovered(true);
    };
    const handleSidebarMouseLeave = () => {
        if (!sidebarExpanded) setSidebarHovered(false);
    };

    const isSidebarOpen = sidebarExpanded || sidebarHovered;

    return (
        <div className={`full-app-layout d-flex flex-column ${theme}-theme`}>
            {/* Navbar */}
            <Navbar
                bg={theme === 'dark' ? 'dark' : 'light'}
                variant={theme === 'dark' ? 'dark' : 'light'}
                expand="md"
                fixed="top"
                className="px-3 navbar"
                style={{ height: 56, zIndex: 1020 }}
            >
                <Row className="align-items-center px-3">
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
                            <Navbar.Text className="me-3" aria-label="Current user name">
                                {user.name}
                            </Navbar.Text>
                            <Button
                                variant={theme === 'dark' ? 'outline-light' : 'outline-dark'}
                                size="sm"
                                onClick={handleLogout}
                            >
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

            {/* Sidebar + Main Content */}
            <div className="app-body">
                <Sidebar
                    expanded={isSidebarOpen}
                    onExpandChange={setSidebarExpanded}
                    onMouseEnter={handleSidebarMouseEnter}
                    onMouseLeave={handleSidebarMouseLeave}
                />
                <main
                    className={`main-content ${isSidebarOpen ? 'sidebar-expanded' : 'sidebar-collapsed'}`}
                    aria-live="polite"
                >
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default Layout;
