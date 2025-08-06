import React from 'react';
import { Breadcrumb } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';
import { FaHome } from 'react-icons/fa';

// Static route → label map
const routeNameMap = {
    '': 'Dashboard',
    dashboard: 'Dashboard',
    'solution-cards': 'Solution Cards',
    // add other fixed route names as needed
};

// Dynamic parameter label map
const dynamicParamLabelMap = {
    solutionId: (id) => `Solution Card #${id}`,
    userId: (id) => `User #${id}`,
    // add more as needed
};

const AppBreadcrumbs = ({ theme = 'light' }) => {
    const location = useLocation();
    const paths = location.pathname.split('/').filter(Boolean);
    let pathSoFar = '';

    return (
        <Breadcrumb className={`mb-0 breadcrumb-${theme}`}>
            {/* Home icon breadcrumb pointing to root */}
            <Breadcrumb.Item linkAs={Link} linkProps={{ to: '/home' }} aria-label="Home">
                <FaHome />
            </Breadcrumb.Item>

            {paths.map((segment, index) => {
                pathSoFar += `/${segment}`;

                // Detect if segment looks like param (e.g. numeric or UUID)
                const isParam = /^\d+$/.test(segment) || /^[0-9a-fA-F-]{8,}$/.test(segment);

                let label;

                if (isParam && index > 0) {
                    const paramName = paths[index - 1];
                    const formatLabel = dynamicParamLabelMap[paramName];
                    label = formatLabel ? formatLabel(segment) : segment;
                } else {
                    label = routeNameMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
                }

                const isLast = index === paths.length - 1;
                const isSecondLast = index === paths.length - 2;

                return (
                    <Breadcrumb.Item
                        key={pathSoFar}
                        {...(!(isLast || isSecondLast) ? { linkAs: Link, linkProps: { to: pathSoFar } } : {})}
                        active={isLast || isSecondLast}
                        aria-current={isLast || isSecondLast ? 'page' : undefined}
                        className={(isLast || isSecondLast) ? 'text-secondary' : ''}
                        style={(isLast || isSecondLast) ? { color: '#6c757d', cursor: 'default', textDecoration: 'none' } : {}}
                    >
                        {label}
                    </Breadcrumb.Item>
                );
            })}
        </Breadcrumb>
    );
};

export default AppBreadcrumbs;
