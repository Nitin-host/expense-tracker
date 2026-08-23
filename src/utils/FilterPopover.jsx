import React from 'react';
import { Button, OverlayTrigger, Popover, Form } from '../components/ui';
import { FaFilter, FaTimes } from 'react-icons/fa';

function FilterPopover({ filterKeys, filters, setFilters }) {
    const handleChange = (key, val) => setFilters((prev) => ({ ...prev, [key]: val }));
    const handleClear = (key) => {
        setFilters((prev) => {
            const updated = { ...prev };
            delete updated[key];
            return updated;
        });
    };

    const popover = (
        <Popover id="filter-popover" className="filter-popover">
            <Popover.Header as="h5">Data Filters</Popover.Header>
            <Popover.Body className="pb-[0.7rem]">
                <Form>
                    <div className="mt-2 flex flex-wrap gap-4 max-md:flex-col max-md:gap-[0.6rem]">
                        {filterKeys.map(({ key, label, options, colorClass }) => (
                            <Form.Group
                                key={key}
                                className="min-w-[140px] max-w-[210px] flex-[1_1_44%] max-md:max-w-full max-md:min-w-[120px] max-md:basis-full"
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
            </Popover.Body>
        </Popover>
    );

    return (
        <OverlayTrigger
            rootClose
            trigger="click"
            placement="bottom-start"
            overlay={popover}
        >
            <Button
                variant="outline-primary"
                size="sm"
                title="Filter"
                className="flex min-h-11 min-w-11 items-center justify-center rounded-[10px] border-0 bg-transparent px-3 py-2 shadow-none !text-[var(--filter-btn-color)] hover:!bg-[var(--filter-btn-hover-bg)] hover:!text-[var(--filter-btn-hover-color)]"
            >
                <FaFilter />
            </Button>
        </OverlayTrigger>
    );
}

export default FilterPopover;
