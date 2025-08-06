import React, { useState, useEffect, useMemo } from 'react';
import { Table, InputGroup, FormControl, Button, Pagination, Card } from 'react-bootstrap';
import FilterPopover from './FilterPopover';
import '../styles/TableUtil.scss';

const isMobile = () => typeof window !== 'undefined' && window.innerWidth < 768;

function TableUtil({
    tableName = 'Data Table',
    tableData = [],
    tableHeader = [],
    tableActions = [],
    searchKeys = [], // Keys to search on, eg ['name', 'category']
    filterKeys = [], // [{ label, key, options }]
    filters = {}, // Selected filter values: { category: ['Food', 'Travel'], status: ['Paid'] }
    setFilters = () => { },
    getCardBorderColor,
}) {
    const [searchText, setSearchText] = useState('');
    const [filterVals, setFilterVals] = useState(filters);
    const [sortConfig, setSortConfig] = useState({ index: 0, asc: true });
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [mobileView, setMobileView] = useState(isMobile());

    useEffect(() => {
        setFilterVals((prevFilters) => {
            // Simple deep equality check using JSON stringify
            if (JSON.stringify(prevFilters) !== JSON.stringify(filters)) {
                return filters;
            }
            return prevFilters;
        });
    }, [filters]);

    useEffect(() => {
        const onResize = () => {
            setMobileView(isMobile());
        };
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    const getNestedValue = (obj, path) =>
        path.split('.').reduce((o, k) => (o ? o[k] : undefined), obj);

    const filteredData = useMemo(() => {
        let filtered = [...tableData];

        if (searchText && searchKeys && searchKeys.length > 0) {
            const s = searchText.toLowerCase();
            filtered = filtered.filter((item) =>
                searchKeys.some((key) => {
                    const val = getNestedValue(item, key);
                    return val && val.toString().toLowerCase().includes(s);
                })
            );
        }

        if (filterKeys && filterKeys.length > 0) {
            Object.entries(filterVals).forEach(([key, values]) => {
                if (values && values.length > 0) {
                    filtered = filtered.filter((item) => {
                        const val = getNestedValue(item, key);
                        return val && values.includes(String(val));
                    });
                }
            });
        }

        const { index, asc } = sortConfig;
        const sortKey = tableHeader[index]?.key;
        if (sortKey) {
            filtered.sort((a, b) => {
                const valA = getNestedValue(a, sortKey);
                const valB = getNestedValue(b, sortKey);
                if (valA === valB) return 0;
                if (asc) return valA > valB ? 1 : -1;
                return valA < valB ? 1 : -1;
            });
        }
        return filtered;
    }, [tableData, filterVals, searchText, sortConfig, tableHeader, searchKeys]);

    const totalPages = Math.ceil(filteredData.length / rowsPerPage);
    const pagedData = filteredData.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage
    );

    const handleSort = (idx) => {
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

    const renderCell = (row, key, format, colDef) => {
        const val = getValueByPath(row, key);

        if (colDef && typeof colDef.render === 'function') {
            return colDef.render(val, row);
        }

        if (val === undefined || val === null) return '';

        if (Array.isArray(val)) {
            const flattened = val.flat(Infinity).filter((v) => v != null);
            const unique = [...new Set(flattened.map(String))];
            return unique.length > 0 ? unique.join(', ') : '-';
        }

        switch (format) {
            case 'currency':
                return `₹${Number(val).toFixed(2)}`;
            case 'date':
                return new Date(val).toLocaleDateString();
            case 'boolean':
                return val ? 'Yes' : 'No';
            default:
                return String(val);
        }
    };

    const MobileCard = ({ row }) => {
        const borderColor =
            typeof getCardBorderColor === 'function' ? getCardBorderColor(row) : '#27ae60';
        return (
            <Card
                className="mb-3"
                style={{
                    borderLeft: `6px solid ${borderColor}`,
                    paddingLeft: '12px',
                }}>
                <Card.Body>
                    {tableHeader.map(({ label, key, dataFormat }, idx) => (
                        <div key={idx} className="d-flex justify-content-between mb-1 flex-wrap">
                            <strong style={{ minWidth: 90 }}>{label}:</strong>{' '}
                            <span style={{ wordBreak: 'break-word', flex: 1 }}>
                                {renderCell(row, key, dataFormat)}
                            </span>
                        </div>
                    ))}
                    <div className="d-flex flex-wrap gap-2 mt-3">
                        {tableActions.map(
                            ({ btnTitle, btnClass, iconComponent: Icon, btnAction, isVisible }, idx) => {
                                if (typeof isVisible === 'function' && !isVisible(row)) return null;
                                return (
                                    <Button
                                        key={idx}
                                        className={'table-action-btn' || btnClass}
                                        size="sm"
                                        onClick={() => btnAction(row)}
                                        title={btnTitle}
                                        variant={btnClass?.includes('outline') ? undefined : 'outline-primary'}
                                    >
                                        {Icon && <Icon style={{ marginRight: 6 }} />}
                                    </Button>
                                );
                            }
                        )}
                    </div>
                </Card.Body>
            </Card>
        );
    };

    return (
        <div>
            {/* Header with Filter Icon and Search */}
            <div className="d-flex justify-content-between flex-wrap align-items-center p-3">
                <h5>{tableName}</h5>
                <div className="d-flex align-items-center">
                    {filterKeys && filterKeys.length > 0 && (
                        <FilterPopover filterKeys={filterKeys} filters={filterVals} setFilters={setFilterVals} />
                    )}
                    {searchKeys && searchKeys.length > 0 && (
                        <InputGroup style={{ maxWidth: 300 }} className="mb-2 ms-2">
                            <FormControl
                                placeholder="Search"
                                value={searchText}
                                onChange={(e) => {
                                    setSearchText(e.target.value);
                                    setCurrentPage(1);
                                }}
                            />
                        </InputGroup>
                    )}
                </div>
            </div>

            {/* Table or Mobile Card View */}
            {mobileView ? (
                <div>
                    {pagedData.length === 0 ? (
                        <p className="text-center my-3">No data found</p>
                    ) : (
                        pagedData.map((row) => <MobileCard key={row._id || row.id} row={row} />)
                    )}
                </div>
            ) : (
                <>
                    <Table striped bordered hover responsive>
                        <thead>
                            <tr>
                                {tableHeader.map(({ label }, idx) => (
                                    <th
                                        key={idx}
                                        style={{ cursor: 'pointer', userSelect: 'none' }}
                                        onClick={() => handleSort(idx)}>
                                        {label} {sortConfig.index === idx ? (sortConfig.asc ? '▲' : '▼') : ''}
                                    </th>
                                ))}
                                {tableActions && tableActions.length > 0 && <th>Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {pagedData.length === 0 ? (
                                <tr>
                                    <td colSpan={tableHeader.length + (tableActions && tableActions.length ? 1 : 0)}>
                                        No data found
                                    </td>
                                </tr>
                            ) : (
                                pagedData.map((row) => (
                                    <tr key={row._id || row.id}>
                                        {tableHeader.map((colDef, idx) => (
                                            <td key={idx}>{renderCell(row, colDef.key, colDef.dataFormat, colDef)}</td>
                                        ))}
                                        {tableActions && tableActions.length > 0 && (
                                            <td>
                                                {tableActions.map(
                                                    ({ btnTitle, btnClass, iconComponent: Icon, btnAction, isVisible }, idx) => {
                                                        if (typeof isVisible === 'function' && !isVisible(row)) return null;
                                                        return (
                                                            <Button
                                                                key={idx}
                                                                className={'table-action-btn' || btnClass}
                                                                size="sm"
                                                                onClick={() => btnAction(row)}
                                                                title={btnTitle}
                                                                variant={btnClass?.includes('outline') ? undefined : 'outline-primary'}
                                                                style={{ marginRight: '6px', marginBottom: '4px' }}
                                                            >
                                                                {Icon && <Icon style={{ marginRight: 4 }} />}
                                                            </Button>
                                                        );
                                                    }
                                                )}
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </Table>
                    {/* Pagination */}
                    {totalPages > 1 && (
                        <Pagination className="justify-content-center my-3">
                            <Pagination.First onClick={() => setCurrentPage(1)} disabled={currentPage === 1} />
                            <Pagination.Prev
                                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                                disabled={currentPage === 1}
                            />
                            {[...Array(totalPages)].map((_, idx) => (
                                <Pagination.Item
                                    key={idx}
                                    active={currentPage === idx + 1}
                                    onClick={() => setCurrentPage(idx + 1)}>
                                    {idx + 1}
                                </Pagination.Item>
                            ))}
                            <Pagination.Next
                                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                                disabled={currentPage === totalPages}
                            />
                            <Pagination.Last
                                onClick={() => setCurrentPage(totalPages)}
                                disabled={currentPage === totalPages}
                            />
                        </Pagination>
                    )}
                </>
            )}
        </div>
    );
}

export default TableUtil;
