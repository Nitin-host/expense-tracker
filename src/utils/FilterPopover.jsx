import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button, OverlayTrigger, Popover, Form } from '../components/ui';
import { FaFilter, FaTimes } from 'react-icons/fa';

const MOBILE_MQ = '(max-width: 767.98px)';

function FilterFields({ filterKeys, filters, handleChange, handleClear }) {
    return (
        <Form>
            <div className="mt-2 flex flex-wrap gap-4 max-md:flex-col max-md:gap-[0.6rem]">
                {filterKeys.map(({ key, label, options, colorClass }) => (
                    <Form.Group
                        key={key}
                        className="min-w-[140px] max-w-[210px] flex-[1_1_44%] max-md:max-w-full max-md:min-w-0 max-md:basis-full"
                    >
                        <Form.Select
                            className={`filter-select ${colorClass || ''}`}
                            value={filters[key] || ''}
                            onChange={(e) => handleChange(key, e.target.value)}
                        >
                            <option value="">{label}</option>
                            {options.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </Form.Select>
                        {filters[key] && (
                            <Button
                                variant="link"
                                size="sm"
                                className="mt-1 p-0 text-[0.8rem] !text-[var(--filter-clear-btn-color)] hover:!text-[var(--filter-clear-btn-hover-color)] hover:underline"
                                onClick={() => handleClear(key)}
                            >
                                Clear <FaTimes />
                            </Button>
                        )}
                    </Form.Group>
                ))}
            </div>
        </Form>
    );
}

function FilterPopover({ filterKeys, filters, setFilters }) {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(() =>
        typeof window !== 'undefined' ? window.matchMedia(MOBILE_MQ).matches : false
    );

    useEffect(() => {
        const mq = window.matchMedia(MOBILE_MQ);
        const onChange = (e) => {
            setIsMobile(e.matches);
            if (!e.matches) setMobileOpen(false);
        };
        mq.addEventListener('change', onChange);
        return () => mq.removeEventListener('change', onChange);
    }, []);

    useEffect(() => {
        if (!mobileOpen) return undefined;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = prev;
        };
    }, [mobileOpen]);

    const handleChange = (key, val) => setFilters((prev) => ({ ...prev, [key]: val }));
    const handleClear = (key) => {
        setFilters((prev) => {
            const updated = { ...prev };
            delete updated[key];
            return updated;
        });
    };

    const filterBtn = (
        <Button
            variant="outline-primary"
            size="sm"
            title="Filter"
            aria-expanded={isMobile ? mobileOpen : undefined}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-[10px] border-0 bg-transparent px-3 py-2 shadow-none !text-[var(--filter-btn-color)] hover:!bg-[var(--filter-btn-hover-bg)] hover:!text-[var(--filter-btn-hover-color)]"
            onClick={isMobile ? () => setMobileOpen((v) => !v) : undefined}
        >
            <FaFilter />
        </Button>
    );

    if (isMobile) {
        return (
            <>
                {filterBtn}
                {mobileOpen &&
                    createPortal(
                        <div className="filter-sheet" role="dialog" aria-modal="true" aria-label="Data Filters">
                            <button
                                type="button"
                                className="filter-sheet__backdrop"
                                aria-label="Close filters"
                                onClick={() => setMobileOpen(false)}
                            />
                            <div className="filter-sheet__panel filter-popover">
                                <div className="filter-sheet__header">
                                    <h5 className="filter-sheet__title">Data Filters</h5>
                                    <button
                                        type="button"
                                        className="filter-sheet__close"
                                        aria-label="Close"
                                        onClick={() => setMobileOpen(false)}
                                    >
                                        <FaTimes />
                                    </button>
                                </div>
                                <div className="filter-sheet__body">
                                    <FilterFields
                                        filterKeys={filterKeys}
                                        filters={filters}
                                        handleChange={handleChange}
                                        handleClear={handleClear}
                                    />
                                </div>
                                <div className="filter-sheet__footer">
                                    <Button
                                        variant="primary"
                                        className="w-full touch-btn"
                                        onClick={() => setMobileOpen(false)}
                                    >
                                        Done
                                    </Button>
                                </div>
                            </div>
                        </div>,
                        document.body
                    )}
            </>
        );
    }

    const popover = (
        <Popover id="filter-popover" className="filter-popover">
            <Popover.Header as="h5">Data Filters</Popover.Header>
            <Popover.Body className="pb-[0.7rem]">
                <FilterFields
                    filterKeys={filterKeys}
                    filters={filters}
                    handleChange={handleChange}
                    handleClear={handleClear}
                />
            </Popover.Body>
        </Popover>
    );

    return (
        <OverlayTrigger rootClose trigger="click" placement="bottom-end" overlay={popover}>
            {filterBtn}
        </OverlayTrigger>
    );
}

export default FilterPopover;
