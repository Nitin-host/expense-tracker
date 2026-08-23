import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { mainMenu, solutionCardSubMenu } from '../menu';
import getIconComponent from '../utils/iconMapper';

function getCurrentSolutionIdFromURL(path) {
    const match = path.match(/^\/solution\/([^/]+)/);
    return match ? match[1] : null;
}

const Sidebar = ({ expanded, forceExpanded = false, onNavigate = () => {}, onRequestExpand = () => {} }) => {
    const location = useLocation();
    const userRole = useSelector((state) => state.auth.user?.role || 'user');

    const showLabels = expanded || forceExpanded;
    const solutionId = getCurrentSolutionIdFromURL(location.pathname);

    const filterByRole = (items) =>
        items.filter((item) => !item.roles || item.roles.includes(userRole));

    const menuToRender = solutionId
        ? filterByRole(
              solutionCardSubMenu.map((item) => ({
                  ...item,
                  url: item.url.replace(':id', solutionId),
              }))
          )
        : filterByRole(mainMenu);

    const normalizePath = (str) => (str.endsWith('/') ? str.slice(0, -1) : str);

    const isMenuItemActive = (item) => {
        if (!item.url) return false;
        return normalizePath(location.pathname) === normalizePath(item.url);
    };

    const sectionLabel = solutionId ? 'Solution' : 'Menu';

    return (
        <nav
            className={`sidebar ${showLabels ? 'expanded' : 'collapsed'} ${
                forceExpanded ? 'in-offcanvas' : ''
            }`}
            aria-label="Main Sidebar Navigation"
        >
            <div className="sidebar__inner">
                {showLabels && <p className="sidebar__section">{sectionLabel}</p>}

                <div className="sidebar__nav">
                    {menuToRender.map((item) => {
                        const IconComponent = getIconComponent(item.icon);
                        const isItemActive = isMenuItemActive(item);

                        return (
                            <Link
                                key={item.id}
                                to={item.url}
                                onClick={() => {
                                    if (!showLabels) onRequestExpand();
                                    onNavigate();
                                }}
                                className={`sidebar__item${isItemActive ? ' is-active' : ''}`}
                                aria-current={isItemActive ? 'page' : undefined}
                                aria-label={item.title}
                                title={!showLabels ? item.title : undefined}
                            >
                                <span className="sidebar__icon-wrap">
                                    <IconComponent aria-hidden />
                                </span>
                                {showLabels && <span className="sidebar__label">{item.title}</span>}
                            </Link>
                        );
                    })}
                </div>
            </div>
        </nav>
    );
};

export default Sidebar;
