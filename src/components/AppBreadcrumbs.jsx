import React from 'react';
import { Breadcrumb } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';
import { FaHome } from 'react-icons/fa';

// Static route → label map
const routeNameMap = {
    '': 'Dashboard',
    dashboard: 'Dashboard',
    'solution-cards': 'Solution Cards',
    // add other fixed route names
};

// Dynamic parameter label map, as before:
const dynamicParamLabelMap = {
    solutionId: (id) => `Solution Card #${id}`,
    userId: (id) => `User #${id}`,
    // add more as needed
};

const AppBreadcrumbs = ({ theme = 'light' }) => {
    const location = useLocation();

    // Split path
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

                // Detect if segment looks like a param (e.g. numeric or UUID)
                const isParam =
                    /^\d+$/.test(segment) ||
                    /^[0-9a-fA-F-]{8,}$/.test(segment);

                let label;

                if (isParam && index > 0) {
                    const paramName = paths[index - 1];
                    const formatLabel = dynamicParamLabelMap[paramName];
                    label = formatLabel ? formatLabel(segment) : segment;
                } else {
                    label = routeNameMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
                }

                const isLast = index === paths.length - 1;

                return (
                    <Breadcrumb.Item
                        key={pathSoFar}
                        linkAs={Link}
                        linkProps={{ to: pathSoFar }}
                        active={isLast}
                        aria-current={isLast ? 'page' : undefined}
                    >
                        {label}
                    </Breadcrumb.Item>
                );
            })}
        </Breadcrumb>
    );
};

export default AppBreadcrumbs;
