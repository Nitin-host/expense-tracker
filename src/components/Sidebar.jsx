import React, { useState } from 'react';
import { Nav } from 'react-bootstrap';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { mainMenu, solutionCardSubMenu } from '../menu';
import CustomTooltip from '../utils/CustomTooltip'; // Your custom tooltip
import getIconComponent from '../utils/iconMapper';

// Helper: extract solution card ID if current path matches /solution-cards/:id/...
function getCurrentSolutionIdFromURL(path) {
    const match = path.match(/^\/solution\/([^/]+)/);
    return match ? match[1] : null;
}

const Sidebar = ({ expanded }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const user = useSelector((state) => state.auth.user);
    const userRole = user?.role || 'user';
    const [openCollapseIds, setOpenCollapseIds] = useState([]);

    // Toggle open state for collapsible menu
    const toggleCollapse = (id) => {
        setOpenCollapseIds((prev) =>
            prev.includes(id) ? prev.filter((cId) => cId !== id) : [...prev, id]
        );
    };

    // Filter menu items by role recursively
    const filterByRole = (items) =>
        items
            .filter((item) => !item.roles || item.roles.includes(userRole))
            .map((item) => {
                if (item.children) {
                    return { ...item, children: filterByRole(item.children) };
                }
                return item;
            });

    const solutionId = getCurrentSolutionIdFromURL(location.pathname);

    // Determine which menu to render:
    const menuToRender = solutionId
        ? filterByRole(
            solutionCardSubMenu.map((item) => ({
                ...item,
                url: item.url.replace(':id', solutionId),
            }))
        )
        : filterByRole(mainMenu);

    const handleLogout = () => {
        dispatch({ type: 'auth/logout' });
        navigate('/login');
    };

    // Only leaf menu items (no children) get the .active class
    const isMenuItemActive = (item) => {
        const normalizePath = (str) =>
            str.endsWith('/') ? str.slice(0, -1) : str;
        if (!item.children || item.children.length === 0) {
            // Exact match for leaves only
            const itemUrl =
                item.url?.replace(/:\w+/g, '') || '';
            return normalizePath(location.pathname) === normalizePath(itemUrl);
        }
        return false;
    };

    // Parent open/collapse: expanded if any child is active
    const isAnyChildActive = (children) =>
        children?.some(
            (child) =>
                isMenuItemActive(child) ||
                (child.children && isAnyChildActive(child.children))
        );

    // Render menu items recursively
    const renderMenuItems = (items) =>
        items.map((item) => {
            const IconComponent = getIconComponent(item.icon);
            const isItemActive = isMenuItemActive(item);

            if (item.action === true && item.id === 'logout') {
                return (
                    <Nav.Link
                        as="button"
                        key={item.id}
                        onClick={handleLogout}
                        className={`d-flex align-items-center nav-item${isItemActive ? ' active' : ''}`}
                        aria-current={isItemActive ? 'page' : undefined}
                    >
                        <IconComponent className="nav-icon" />
                        {expanded && <span className="nav-text">{item.title}</span>}
                    </Nav.Link>
                );
            }

            if (item.children && item.children.length > 0) {
                // Parent expanded if any child active or user opened it
                const isOpen =
                    openCollapseIds.includes(item.id) ||
                    isAnyChildActive(item.children);

                return (
                    <div key={item.id} className="nav-group">
                        <Nav.Link
                            onClick={() => toggleCollapse(item.id)}
                            aria-expanded={isOpen}
                            aria-controls={`${item.id}-submenu`}
                            className={`d-flex align-items-center nav-item${isOpen ? ' expanded' : ''}`}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') toggleCollapse(item.id);
                            }}
                        // No .active class here!
                        >
                            <IconComponent className="nav-icon" />
                            {expanded && <span className="nav-text">{item.title}</span>}
                            <span className="ms-auto">
                                {expanded ? (isOpen ? '▾' : '▸') : ''}
                            </span>
                        </Nav.Link>
                        <Nav
                            id={`${item.id}-submenu`}
                            className={`flex-column ms-3 collapse-submenu${isOpen ? ' show' : ''}`}
                            aria-hidden={!isOpen}
                        >
                            {renderMenuItems(item.children)}
                        </Nav>
                    </div>
                );
            }

            // Only leaf nodes get the .active highlight
            return (
                <CustomTooltip key={item.id} content={item.title} position="right">
                    <Nav.Link
                        as={Link}
                        to={item.url}
                        className={`d-flex align-items-center nav-item${isItemActive ? ' active' : ''}`}
                        aria-current={isItemActive ? 'page' : undefined}
                    >
                        <IconComponent className="nav-icon" />
                        {expanded && <span className="nav-text">{item.title}</span>}
                    </Nav.Link>
                </CustomTooltip>
            );
        });

    return (
        <nav
            className={`sidebar ${expanded ? 'expanded' : 'collapsed'}`}
            aria-label="Main Sidebar Navigation"
        >
            <Nav className="flex-column">{renderMenuItems(menuToRender)}</Nav>
        </nav>
    );
};

export default Sidebar;
