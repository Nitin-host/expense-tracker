import React, { useEffect, useMemo, useState } from 'react';
import { Breadcrumb } from './ui';
import { Link, useLocation, useParams } from 'react-router-dom';
import { FaHome } from 'react-icons/fa';
import api from '../api/http';

const ROUTE_LABELS = {
    home: 'Home',
    solution: 'Solutions',
    dashboard: 'Dashboard',
    'collected-cash': 'Collected Cash',
    'expense-data': 'Expenses',
    reports: 'Reports',
    'create-user': 'Users',
};

const isMongoId = (segment) => /^[0-9a-fA-F]{24}$/.test(segment);

const solutionNameCache = new Map();

const AppBreadcrumbs = ({ theme = 'light' }) => {
    const location = useLocation();
    const params = useParams();
    const [solutionName, setSolutionName] = useState('');

    const solutionId = useMemo(() => {
        if (params.id && isMongoId(params.id)) return params.id;
        const match = location.pathname.match(/^\/solution\/([^/]+)/);
        const id = match?.[1];
        return id && isMongoId(id) ? id : null;
    }, [location.pathname, params.id]);

    useEffect(() => {
        if (!solutionId) {
            setSolutionName('');
            return undefined;
        }

        if (solutionNameCache.has(solutionId)) {
            setSolutionName(solutionNameCache.get(solutionId));
            return undefined;
        }

        let cancelled = false;
        (async () => {
            try {
                const res = await api.get(`/solution/${solutionId}`);
                const name =
                    res.data?.solutionCard?.name ||
                    res.data?.name ||
                    res.data?.data?.name ||
                    '';
                solutionNameCache.set(solutionId, name);
                if (!cancelled) setSolutionName(name);
            } catch {
                if (!cancelled) setSolutionName('');
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [solutionId]);

    const crumbs = useMemo(() => {
        const paths = location.pathname.split('/').filter(Boolean);
        const items = [];
        let pathSoFar = '';

        paths.forEach((segment, index) => {
            pathSoFar += `/${segment}`;
            const isLast = index === paths.length - 1;

            if (isMongoId(segment) && paths[index - 1] === 'solution') {
                items.push({
                    to: `/solution/${segment}/dashboard`,
                    label: solutionName || 'Solution',
                    active: isLast,
                });
                return;
            }

            const label =
                ROUTE_LABELS[segment] ||
                segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');

            items.push({
                to: pathSoFar,
                label,
                active: isLast,
            });
        });

        return items;
    }, [location.pathname, solutionName]);

    if (!crumbs.length) return null;

    return (
        <Breadcrumb className={theme === 'dark' ? 'app-breadcrumbs--dark' : 'app-breadcrumbs--light'}>
            <Breadcrumb.Item linkAs={Link} linkProps={{ to: '/home' }} title="Home">
                <FaHome aria-hidden />
            </Breadcrumb.Item>
            {crumbs.map((crumb) =>
                crumb.active ? (
                    <Breadcrumb.Item active key={crumb.to}>
                        {crumb.label}
                    </Breadcrumb.Item>
                ) : (
                    <Breadcrumb.Item key={crumb.to} linkAs={Link} linkProps={{ to: crumb.to }}>
                        {crumb.label}
                    </Breadcrumb.Item>
                )
            )}
        </Breadcrumb>
    );
};

export default AppBreadcrumbs;
