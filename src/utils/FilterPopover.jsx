// FilterPopover.jsx
import React from 'react';
import { Button, OverlayTrigger, Popover, Form } from 'react-bootstrap';
import { FaFilter, FaTimes } from 'react-icons/fa';
import '../styles/filterPopover.scss';

function FilterPopover({ filterKeys, filters, setFilters }) {
    const handleChange = (key, val) => setFilters(prev => ({ ...prev, [key]: val }));
    const handleClear = (key) => {
        setFilters(prev => {
            const updated = { ...prev };
            delete updated[key];
            return updated;
        });
    };

    const popover = (
        <Popover id="filter-popover" className="filter-popover">
            <Popover.Header as="h5">Data Filters</Popover.Header>
            <Popover.Body>
                <Form>
                    <div className="filter-container">
                        {filterKeys.map(({ key, label, options, colorClass }) => (
                            <Form.Group key={key} className="filter-group">
                                <Form.Select
                                    className={`filter-select ${colorClass || ''}`}
                                    value={filters[key] || ''}
                                    onChange={e => handleChange(key, e.target.value)}
                                >
                                    <option value="">{label}</option>
                                    {options.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </Form.Select>
                                {filters[key] && (
                                    <Button
                                        variant="link"
                                        size="sm"
                                        className="filter-clear-btn"
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
            <Button variant="outline-primary" size="sm" title="Filter" className="filter-trigger-btn">
                <FaFilter />
            </Button>
        </OverlayTrigger>
    );
}

export default FilterPopover;
