import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FaArrowLeft } from 'react-icons/fa';
import { mainMenu, solutionCardSubMenu } from '../menu';
import getIconComponent from '../utils/iconMapper';

function getCurrentSolutionIdFromURL(path) {
    const match = path.match(/^\/solution\/([^/]+)/);
    return match ? match[1] : null;
}

const MobileBottomNav = () => {
    const location = useLocation();
    const user = useSelector((state) => state.auth.user);
    const userRole = user?.role || 'user';

    const solutionId = getCurrentSolutionIdFromURL(location.pathname);

    const filterByRole = (items) =>
        items.filter((item) => !item.roles || item.roles.includes(userRole));

    const items = solutionId
        ? [
              {
                  id: 'back-solutions',
                  title: 'Solutions',
                  url: '/solution',
                  icon: 'FaArrowLeft',
              },
              ...filterByRole(
                  solutionCardSubMenu.map((item) => ({
                      ...item,
                      url: item.url.replace(':id', solutionId),
                  }))
              ),
          ]
        : filterByRole(mainMenu);

    const shortTitle = (item) => {
        const map = {
            'collected-cash': 'Cash',
            'expense-data': 'Expenses',
            'create-user': 'Users',
            'back-solutions': 'Back',
        };
        return map[item.id] || item.title;
    };

    const normalizePath = (str) => (str.endsWith('/') ? str.slice(0, -1) : str);

    const isActive = (item) => {
        if (!item.url) return false;
        return normalizePath(location.pathname) === normalizePath(item.url);
    };

    const renderItemContent = (item, Icon) => (
        <>
            <span className="mobile-bottom-nav__icon-wrap">
                <Icon className="mobile-bottom-nav__icon" aria-hidden />
            </span>
            <span className="mobile-bottom-nav__label">{shortTitle(item)}</span>
        </>
    );

    return (
        <nav className="mobile-bottom-nav" aria-label="Primary">
            <div className="mobile-bottom-nav__dock">
                {items.map((item) => {
                    const Icon =
                        item.id === 'back-solutions'
                            ? FaArrowLeft
                            : getIconComponent(item.icon);
                    const active = isActive(item);

                    return (
                        <Link
                            key={item.id}
                            to={item.url}
                            className={`mobile-bottom-nav__item${active ? ' is-active' : ''}`}
                            aria-current={active ? 'page' : undefined}
                            aria-label={item.title}
                        >
                            {renderItemContent(item, Icon)}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
};

export default MobileBottomNav;
