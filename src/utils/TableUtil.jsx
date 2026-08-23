import React, { useState, useEffect, useMemo, useRef, useCallback, useContext } from 'react';
import { Table, InputGroup, FormControl, Pagination } from '../components/ui';
import FilterPopover from './FilterPopover';
import { SkeletonTableCards } from '../components/Skeleton';
import { formatDate } from './formatDate';
import { ThemeContext } from './ThemeContext';

const MOBILE_MQ = '(max-width: 767.98px)';
const MOBILE_BATCH = 10;

const BADGE_KEYS = new Set(['role', 'category', 'paymentStatus', 'status']);
const HIGHLIGHT_KEYS = new Set(['amount', 'advancePaid', 'pendingAmount', 'total', 'balance']);

function isEmptyCellValue(val) {
    if (val === undefined || val === null || val === '') return true;
    if (val === '—' || val === '-') return true;
    if (Array.isArray(val) && val.length === 0) return true;
    return false;
}

function getFieldKey(key) {
    return String(key || '').split('.').pop().toLowerCase();
}

function getNestedValue(obj, path) {
    return String(path || '')
        .split('.')
        .reduce((o, k) => (o != null ? o[k] : undefined), obj);
}

function formatRoleLabel(role) {
    if (!role) return '';
    return String(role)
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
}

function getColumnAlign(colDef) {
    if (colDef?.align) return colDef.align;
    if (colDef?.dataFormat === 'currency') return 'right';
    if (colDef?.dataFormat === 'date') return 'left';
    return 'left';
}

function getColumnClass(colDef) {
    const classes = [`et-table-cell--${getColumnAlign(colDef)}`];
    if (colDef?.dataFormat === 'currency') classes.push('et-table-cell--currency');
    if (colDef?.dataFormat === 'date') classes.push('et-table-cell--date');
    return classes.join(' ');
}

function MobileCard({
    row,
    tableHeader,
    tableActions,
    getCardBorderColor,
    renderCell,
}) {
    const accent =
        typeof getCardBorderColor === 'function' ? getCardBorderColor(row) : '#0f766e';

    const visibleActions = (tableActions || []).filter((action) => {
        if (typeof action.isVisible === 'function') return action.isVisible(row);
        return action.isVisible !== false;
    });

    const primary = tableHeader[0];
    const rest = tableHeader.slice(1);

    const badges = [];
    const highlights = [];
    const details = [];

    rest.forEach((col) => {
        if (col.mobileHide) return;
        const fieldKey = getFieldKey(col.key);
        const raw = renderCell(row, col.key, col.dataFormat, col);
        if (isEmptyCellValue(raw)) return;

        if (col.mobileDate || col.dataFormat === 'date') {
            details.unshift({ label: col.label, value: raw, key: col.key, isDate: true });
            return;
        }

        if (col.mobileBadge || BADGE_KEYS.has(fieldKey)) {
            badges.push({ label: col.label, value: raw, key: col.key });
            return;
        }

        if (
            col.mobileHighlight ||
            col.dataFormat === 'currency' ||
            HIGHLIGHT_KEYS.has(fieldKey)
        ) {
            highlights.push({ label: col.label, value: raw, key: col.key, col });
            return;
        }

        details.push({ label: col.label, value: raw, key: col.key });
    });

    const title = primary
        ? renderCell(row, primary.key, primary.dataFormat, primary)
        : 'Untitled';

    const dateMeta = details.find((d) => d.isDate) || null;
    const detailRows = dateMeta ? details.filter((d) => !d.isDate) : details;

    return (
        <article className="mobile-data-card" style={{ '--card-accent': accent }}>
            <div className="mobile-data-card__accent" aria-hidden />

            <div className="mobile-data-card__body">
                <header className="mobile-data-card__header">
                    <div className="mobile-data-card__title-wrap">
                        <h3 className="mobile-data-card__title">{title}</h3>
                        {dateMeta && (
                            <time className="mobile-data-card__date" dateTime={String(getNestedValue(row, dateMeta.key) || '')}>
                                {dateMeta.value}
                            </time>
                        )}
                        {badges.length > 0 && (
                            <div className="mobile-data-card__badges">
                                {badges.map(({ label, value, key }) => (
                                    <span key={key} className="mobile-data-card__badge" title={label}>
                                        {typeof value === 'string' && value.length < 24
                                            ? formatRoleLabel(value)
                                            : value}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </header>

                {highlights.length > 0 && (
                    <div
                        className={`mobile-data-card__metrics ${
                            highlights.length === 1 ? 'mobile-data-card__metrics--single' : ''
                        }`}
                    >
                        {highlights.map(({ label, value, key }) => (
                            <div key={key} className="mobile-data-card__metric">
                                <span className="mobile-data-card__metric-label">{label}</span>
                                <span className="mobile-data-card__metric-value">{value}</span>
                            </div>
                        ))}
                    </div>
                )}

                {detailRows.length > 0 && (
                    <dl className="mobile-data-card__details">
                        {detailRows.map(({ label, value, key }) => (
                            <div key={key} className="mobile-data-card__detail-row">
                                <dt>{label}</dt>
                                <dd>{value}</dd>
                            </div>
                        ))}
                    </dl>
                )}
            </div>

            {visibleActions.length > 0 && (
                <footer className="mobile-data-card__actions">
                    {visibleActions.map(({ btnTitle, iconComponent: Icon, btnAction, btnClass = '' }) => {
                        const isDanger =
                            btnClass.includes('danger') || /delete/i.test(btnTitle);

                        return (
                            <button
                                key={btnTitle}
                                type="button"
                                className={`mobile-data-card__action${isDanger ? ' mobile-data-card__action--danger' : ''}`}
                                onClick={() => btnAction(row)}
                                aria-label={btnTitle}
                            >
                                {Icon && <Icon className="mobile-data-card__action-icon" aria-hidden />}
                                <span>{btnTitle}</span>
                            </button>
                        );
                    })}
                </footer>
            )}
        </article>
    );
}

function getPageWindow(current, total, windowSize = 5) {
    if (total <= windowSize) {
        return Array.from({ length: total }, (_, i) => i + 1);
    }
    const half = Math.floor(windowSize / 2);
    let start = Math.max(1, current - half);
    let end = Math.min(total, start + windowSize - 1);
    start = Math.max(1, end - windowSize + 1);
    const pages = [];
    if (start > 1) {
        pages.push(1);
        if (start > 2) pages.push('…');
    }
    for (let i = start; i <= end; i += 1) pages.push(i);
    if (end < total) {
        if (end < total - 1) pages.push('…');
        pages.push(total);
    }
    return pages;
}

function TableUtil({
    tableName = 'Data Table',
    tableData = [],
    tableHeader = [],
    tableActions = [],
    searchKeys = [],
    filterKeys = [],
    filters = {},
    setFilters = () => {},
    getCardBorderColor,
    serverPagination = null,
    onPageChange = null,
    hasMore = false,
    loadingMore = false,
    onLoadMore = null,
    searchText: controlledSearch = undefined,
    setSearchText: setControlledSearch = undefined,
    onServerFilterChange = null,
    toolbarExtra = null,
}) {
    const [internalSearch, setInternalSearch] = useState('');
    const searchText = controlledSearch !== undefined ? controlledSearch : internalSearch;
    const setSearchText = setControlledSearch || setInternalSearch;
    const [filterVals, setFilterVals] = useState(filters);
    const [sortConfig, setSortConfig] = useState({ index: 0, asc: true });
    const [currentPage, setCurrentPage] = useState(serverPagination?.page || 1);
    const [rowsPerPage] = useState(serverPagination?.limit || 10);
    const [mobileVisibleCount, setMobileVisibleCount] = useState(MOBILE_BATCH);
    const [mobileView, setMobileView] = useState(
        typeof window !== 'undefined' ? window.matchMedia(MOBILE_MQ).matches : false
    );
    const { theme } = useContext(ThemeContext);
    const sentinelRef = useRef(null);
    const loadingMoreRef = useRef(loadingMore);
    const searchDebounceRef = useRef(null);
    const filterValsRef = useRef(filterVals);
    const searchTextRef = useRef(searchText);
    loadingMoreRef.current = loadingMore;
    filterValsRef.current = filterVals;
    searchTextRef.current = searchText;

    const usesServerQuery = Boolean(serverPagination && onServerFilterChange);

    const triggerServerQuery = useCallback(
        (nextFilters, nextSearch) => {
            if (!usesServerQuery) return;
            onServerFilterChange(
                nextFilters ?? filterValsRef.current,
                nextSearch ?? searchTextRef.current
            );
        },
        [usesServerQuery, onServerFilterChange]
    );

    useEffect(() => {
        return () => {
            if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
        };
    }, []);

    useEffect(() => {
        setFilterVals((prevFilters) => {
            if (JSON.stringify(prevFilters) !== JSON.stringify(filters)) {
                return filters;
            }
            return prevFilters;
        });
    }, [filters]);

    useEffect(() => {
        if (serverPagination?.page) setCurrentPage(serverPagination.page);
    }, [serverPagination?.page]);

    useEffect(() => {
        setMobileVisibleCount(MOBILE_BATCH);
    }, [tableData, searchText, filterVals, sortConfig]);

    useEffect(() => {
        const mq = window.matchMedia(MOBILE_MQ);
        const onChange = (e) => setMobileView(e.matches);
        mq.addEventListener('change', onChange);
        return () => mq.removeEventListener('change', onChange);
    }, []);

    const getNestedValueInTable = (obj, path) =>
        path.split('.').reduce((o, k) => (o ? o[k] : undefined), obj);

    const filteredData = useMemo(() => {
        let filtered = [...tableData];

        if (searchText && searchKeys && searchKeys.length > 0 && !usesServerQuery) {
            const s = searchText.toLowerCase();
            filtered = filtered.filter((item) =>
                searchKeys.some((key) => {
                    const val = getNestedValueInTable(item, key);
                    return val != null && String(val).toLowerCase().includes(s);
                })
            );
        }

        if (filterKeys && filterKeys.length > 0 && !usesServerQuery) {
            Object.entries(filterVals).forEach(([key, selected]) => {
                if (selected == null || selected === '') return;
                filtered = filtered.filter((item) => {
                    const val = getNestedValueInTable(item, key);
                    if (val == null) return false;
                    if (Array.isArray(selected)) {
                        return selected.length > 0 && selected.includes(String(val));
                    }
                    return String(val) === String(selected);
                });
            });
        }

        if (usesServerQuery) {
            return filtered;
        }

        const { index, asc } = sortConfig;
        const sortKey = tableHeader[index]?.key;
        if (sortKey) {
            filtered.sort((a, b) => {
                const valA = getNestedValueInTable(a, sortKey);
                const valB = getNestedValueInTable(b, sortKey);
                if (valA === valB) return 0;
                if (asc) return valA > valB ? 1 : -1;
                return valA < valB ? 1 : -1;
            });
        }
        return filtered;
    }, [
        tableData,
        filterVals,
        searchText,
        sortConfig,
        tableHeader,
        searchKeys,
        filterKeys,
        usesServerQuery,
    ]);

    const totalPages = serverPagination
        ? serverPagination.totalPages || 1
        : Math.max(1, Math.ceil(filteredData.length / rowsPerPage) || 1);

    const desktopData = serverPagination
        ? filteredData
        : filteredData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

    const mobileClientHasMore = !serverPagination && mobileVisibleCount < filteredData.length;
    const mobileData = mobileView
        ? serverPagination
            ? filteredData
            : filteredData.slice(0, mobileVisibleCount)
        : desktopData;

    const displayData = mobileView ? mobileData : desktopData;

    const canLoadMoreMobile = mobileView && (serverPagination ? hasMore : mobileClientHasMore);

    const loadMoreMobile = useCallback(() => {
        if (loadingMoreRef.current) return;
        if (serverPagination) {
            if (hasMore && typeof onLoadMore === 'function') onLoadMore();
            return;
        }
        setMobileVisibleCount((prev) => Math.min(prev + MOBILE_BATCH, filteredData.length));
    }, [serverPagination, hasMore, onLoadMore, filteredData.length]);

    useEffect(() => {
        if (!mobileView || !canLoadMoreMobile) return undefined;
        const node = sentinelRef.current;
        if (!node) return undefined;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting) loadMoreMobile();
            },
            { root: null, rootMargin: '120px', threshold: 0 }
        );
        observer.observe(node);
        return () => observer.disconnect();
    }, [mobileView, canLoadMoreMobile, loadMoreMobile, displayData.length]);

    const goToPage = (page) => {
        setCurrentPage(page);
        if (typeof onPageChange === 'function') onPageChange(page);
    };

    const handleSort = (idx) => {
        if (serverPagination) return;
        setCurrentPage(1);
        setSortConfig((prev) =>
            prev.index === idx ? { index: idx, asc: !prev.asc } : { index: idx, asc: true }
        );
    };

    function getValueByPath(obj, path) {
        const keys = path.split('.');
        let current = obj;
        for (const key of keys) {
            if (current === undefined || current === null) return undefined;
            if (Array.isArray(current)) {
                current = current.map((item) => item[key]).flat();
                current = current.flat(Infinity);
            } else {
                current = current[key];
            }
        }
        return current;
    }

    const hasVisibleActions = useMemo(() => {
        if (!tableActions || tableActions.length === 0) return false;
        if (displayData.length === 0) return false;

        return displayData.some((row) =>
            tableActions.some((action) => {
                if (typeof action.isVisible === 'function') {
                    return action.isVisible(row);
                }
                return action.isVisible !== false;
            })
        );
    }, [tableActions, displayData]);

    const renderCell = (row, key, format, colDef) => {
        const val = getValueByPath(row, key);

        if (colDef && typeof colDef.render === 'function') {
            return colDef.render(val, row);
        }

        if (val === undefined || val === null) {
            if (format === 'date') return formatDate(val);
            return '';
        }

        if (Array.isArray(val)) {
            const flattened = val.flat(Infinity).filter((v) => v != null);
            const unique = [...new Set(flattened.map(String))];
            return unique.length > 0 ? unique.join(', ') : '-';
        }

        switch (format) {
            case 'currency':
                return `₹${Number(val).toFixed(2)}`;
            case 'date':
                return formatDate(val);
            case 'boolean':
                return val ? 'Yes' : 'No';
            default:
                return String(val);
        }
    };

    const pageItems = getPageWindow(currentPage, totalPages);
    const showDesktopPagination = !mobileView && totalPages > 1;

    return (
        <div className="table-util-wrap page-surface overflow-hidden">
            <div className="table-util-toolbar">
                <h5 className="table-util-toolbar__title">{tableName}</h5>

                {filterKeys && filterKeys.length > 0 ? (
                    <div className="table-util-toolbar__filter">
                        <FilterPopover
                            filterKeys={filterKeys}
                            filters={filterVals}
                            setFilters={(next) => {
                                const val = typeof next === 'function' ? next(filterVals) : next;
                                setFilterVals(val);
                                setFilters(val);
                                if (usesServerQuery) triggerServerQuery(val, searchTextRef.current);
                            }}
                        />
                    </div>
                ) : null}

                {searchKeys && searchKeys.length > 0 ? (
                    <InputGroup className="mb-0 table-util-toolbar__search">
                        <FormControl
                            placeholder="Search entries..."
                            value={searchText}
                            inputMode="search"
                            enterKeyHint="search"
                            onChange={(e) => {
                                const value = e.target.value;
                                setSearchText(value);
                                setCurrentPage(1);
                                if (usesServerQuery) {
                                    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
                                    searchDebounceRef.current = setTimeout(() => {
                                        triggerServerQuery(filterValsRef.current, value);
                                    }, 350);
                                }
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && usesServerQuery) {
                                    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
                                    triggerServerQuery(filterValsRef.current, e.target.value);
                                }
                            }}
                        />
                    </InputGroup>
                ) : null}

                {toolbarExtra ? (
                    <div className="table-util-toolbar__extra">{toolbarExtra}</div>
                ) : null}
            </div>

            {mobileView ? (
                <div className="mobile-data-card-list">
                    {displayData.length === 0 && !loadingMore ? (
                        <div className="mobile-data-card-empty">
                            <p>No entries found</p>
                            <span>Try adjusting search or filters</span>
                        </div>
                    ) : (
                        displayData.map((row) => (
                            <MobileCard
                                key={row._id || row.id || row.key}
                                row={row}
                                tableHeader={tableHeader}
                                tableActions={tableActions}
                                getCardBorderColor={getCardBorderColor}
                                renderCell={renderCell}
                            />
                        ))
                    )}

                    {loadingMore && (
                        <div className="mobile-data-card-list__loading">
                            <SkeletonTableCards count={2} />
                        </div>
                    )}

                    {canLoadMoreMobile && !loadingMore && (
                        <div ref={sentinelRef} className="pointer-events-none h-px w-full" aria-hidden />
                    )}
                </div>
            ) : (
                <Table striped hover responsive className="mb-0 et-data-table">
                    <thead>
                        <tr>
                            {tableHeader.map((colDef, idx) => (
                                <th
                                    key={idx}
                                    className={getColumnClass(colDef)}
                                    style={{
                                        cursor: serverPagination ? 'default' : 'pointer',
                                        userSelect: 'none',
                                    }}
                                    onClick={() => handleSort(idx)}
                                >
                                    <span className="et-table-head-label">
                                        {colDef.label}
                                        {!serverPagination && sortConfig.index === idx && (
                                            <span className="et-table-sort" aria-hidden>
                                                {sortConfig.asc ? ' ▲' : ' ▼'}
                                            </span>
                                        )}
                                    </span>
                                </th>
                            ))}
                            {hasVisibleActions && (
                                <th className="et-table-cell--actions">Actions</th>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {displayData.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={tableHeader.length + (hasVisibleActions ? 1 : 0)}
                                    className="et-table-empty"
                                >
                                    No data found
                                </td>
                            </tr>
                        ) : (
                            displayData.map((row) => (
                                <tr key={row._id || row.id}>
                                    {tableHeader.map((colDef, idx) => (
                                        <td key={idx} className={getColumnClass(colDef)}>
                                            {renderCell(row, colDef.key, colDef.dataFormat, colDef)}
                                        </td>
                                    ))}
                                    {tableActions && tableActions.length > 0 && (
                                        <td className="et-table-cell--actions">
                                            <div className="et-table-actions">
                                                {tableActions.map(
                                                    (
                                                        {
                                                            btnTitle,
                                                            btnClass = '',
                                                            iconComponent: Icon,
                                                            btnAction,
                                                            isVisible,
                                                        },
                                                        idx
                                                    ) => {
                                                        if (
                                                            typeof isVisible === 'function' &&
                                                            !isVisible(row)
                                                        ) {
                                                            return null;
                                                        }

                                                        const isDanger =
                                                            btnClass.includes('danger') ||
                                                            /delete/i.test(btnTitle);

                                                        return (
                                                            <button
                                                                key={idx}
                                                                type="button"
                                                                className={`et-table-action-btn${
                                                                    isDanger ? ' et-table-action-btn--danger' : ''
                                                                }`}
                                                                onClick={() => btnAction?.(row)}
                                                                title={btnTitle}
                                                                aria-label={btnTitle}
                                                            >
                                                                {Icon ? <Icon size={15} aria-hidden /> : null}
                                                            </button>
                                                        );
                                                    }
                                                )}
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))
                        )}
                    </tbody>
                </Table>
            )}

            {showDesktopPagination && (
                <Pagination className={`justify-content-center my-3 pagination-${theme} flex-wrap`}>
                    <Pagination.First onClick={() => goToPage(1)} disabled={currentPage === 1} />
                    <Pagination.Prev
                        onClick={() => goToPage(Math.max(currentPage - 1, 1))}
                        disabled={currentPage === 1}
                    />
                    {pageItems.map((item, idx) =>
                        item === '…' ? (
                            <Pagination.Ellipsis key={`e-${idx}`} disabled />
                        ) : (
                            <Pagination.Item
                                key={item}
                                active={currentPage === item}
                                onClick={() => goToPage(item)}
                            >
                                {item}
                            </Pagination.Item>
                        )
                    )}
                    <Pagination.Next
                        onClick={() => goToPage(Math.min(currentPage + 1, totalPages))}
                        disabled={currentPage === totalPages}
                    />
                    <Pagination.Last
                        onClick={() => goToPage(totalPages)}
                        disabled={currentPage === totalPages}
                    />
                </Pagination>
            )}
        </div>
    );
}

export default TableUtil;
