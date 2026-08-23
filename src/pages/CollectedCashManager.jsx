import React, { useState, useEffect, useCallback } from 'react';
import TableUtil from '../utils/TableUtil';
import { Button, Modal, Form } from '../components/ui';
import { FaEdit, FaTrashAlt, FaDownload } from 'react-icons/fa';
import { fetchAndExport } from '../utils/export';
import api from '../api/http';
import { useParams } from 'react-router-dom';
import { useAlert } from '../context/alertContext';
import { SkeletonTablePage } from '../components/Skeleton';
import { sanitizeDecimalInput } from '../utils/numericInput';

function CollectedCashManager() {
    const { id: solutionId } = useParams();

    const [collectedCashList, setCollectedCashList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        totalPages: 1,
        total: 0,
        hasMore: false,
    });

    const [showForm, setShowForm] = useState(false);
    const [editableCash, setEditableCash] = useState(null);

    const [deleteModal, setDeleteModal] = useState({ show: false, collectedCash: null });
    const [searchText, setSearchText] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        amount: '',
    });

    const { notifySuccess, notifyError } = useAlert();
    const [accessLevel, setAccessLevel] = useState(null);

    const fetchCollectedCash = useCallback(async (pageNum = 1, { append = false, searchOverride } = {}) => {
        if (append) setLoadingMore(true);
        else setLoading(true);
        try {
            const activeSearch = searchOverride ?? searchText;
            const params = { page: pageNum, limit: 20 };
            if (activeSearch?.trim()) params.q = activeSearch.trim();

            const res = await api.get(`/collected-cash/solution/${solutionId}`, { params });
            const list = res.data.collectedCash || res.data.data || [];
            setCollectedCashList((prev) => {
                if (!append) return list;
                const merged = [...prev, ...list];
                return merged.length > 200 ? merged.slice(merged.length - 200) : merged;
            });
            const nextPage = res.data.page || pageNum;
            const totalPages = res.data.totalPages || 1;
            setPagination({
                page: nextPage,
                limit: res.data.limit || 20,
                totalPages,
                total: res.data.total || list.length,
                hasMore: Boolean(res.data.hasMore ?? nextPage < totalPages),
            });
            setPage(nextPage);
            setAccessLevel(res.data.accessLevel || null);
        } catch (err) {
            const apiMessage = err?.response?.data?.error?.message;
            notifyError(apiMessage || 'Failed to load collected cash data');
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [solutionId, searchText, notifyError]);

    const handleServerFilterChange = (_nextFilters, nextSearch) => {
        if (nextSearch !== undefined) setSearchText(nextSearch);
        setPage(1);
        fetchCollectedCash(1, {
            append: false,
            searchOverride: nextSearch ?? searchText,
        });
    };

    useEffect(() => {
        if (solutionId) {
            setPage(1);
            fetchCollectedCash(1, { append: false });
        }
    }, [solutionId, fetchCollectedCash]);

    useEffect(() => {
        const mq = window.matchMedia('(max-width: 767.98px)');
        const onChange = (e) => {
            if (!e.matches && solutionId) {
                fetchCollectedCash(1, { append: false });
            }
        };
        mq.addEventListener('change', onChange);
        return () => mq.removeEventListener('change', onChange);
    }, [solutionId, fetchCollectedCash]);

    const handleLoadMore = () => {
        if (loadingMore || !pagination.hasMore) return;
        fetchCollectedCash(page + 1, { append: true, searchOverride: searchText });
    };

    const handleDesktopPageChange = (pageNum) => {
        setPage(pageNum);
        fetchCollectedCash(pageNum, { append: false, searchOverride: searchText });
    };

    const openAddForm = () => {
        setEditableCash(null);
        setFormData({ name: '', amount: '' });
        setShowForm(true);
    };

    const openEditForm = (cash) => {
        setEditableCash(cash);
        setFormData({
            name: cash.name,
            amount: cash.amount.toString(),
        });
        setShowForm(true);
    };

    const closeForm = () => {
        setEditableCash(null);
        setShowForm(false);
        setFormData({ name: '', amount: '' });
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: name === 'amount' ? sanitizeDecimalInput(value) : value,
        }));
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name.trim() || !formData.amount.trim()) {
            notifyError('Name and Amount are required.');
            return;
        }

        if (isNaN(formData.amount) || Number(formData.amount) <= 0) {
            notifyError('Amount must be a positive number.');
            return;
        }

        try {
            if (editableCash) {
                await api.put(`/collected-cash/${editableCash._id}`, {
                    name: formData.name.trim(),
                    amount: Number(formData.amount),
                });
                notifySuccess('Collected cash updated successfully!');
            } else {
                await api.post('/collected-cash', {
                    solutionCardId: solutionId,
                    name: formData.name.trim(),
                    amount: Number(formData.amount),
                });
                notifySuccess('Collected cash added successfully!');
            }
            closeForm();
            fetchCollectedCash(1, { append: false });
        } catch (err) {
            const apiMessage = err?.response?.data?.error?.message;
            notifyError(apiMessage || 'Failed to save collected cash.');
        }
    };

    const handleDelete = async () => {
        const cash = deleteModal.collectedCash;
        if (!cash) return;

        try {
            await api.delete(`/collected-cash/${cash._id}`);
            notifySuccess('Collected cash entry deleted successfully!');
            fetchCollectedCash(1, { append: false });
        } catch (err) {
            const apiMessage = err?.response?.data?.error?.message;
            notifyError(apiMessage || 'Failed to delete collected cash entry.');
        } finally {
            setDeleteModal({ show: false, collectedCash: null });
        }
    };

    const actions = [
        {
            btnTitle: 'Edit',
            btnClass: 'btn btn-sm btn-outline-primary',
            iconComponent: FaEdit,
            btnAction: openEditForm,
            isVisible: () => accessLevel === 'owner' || accessLevel === 'editor',
        },
        {
            btnTitle: 'Delete',
            btnClass: 'btn btn-sm btn-outline-danger',
            iconComponent: FaTrashAlt,
            btnAction: (cash) => setDeleteModal({ show: true, collectedCash: cash }),
            isVisible: () => accessLevel === 'owner' || accessLevel === 'editor',
        },
    ];

    const tableHeader = [
        { label: 'Contributor', key: 'name' },
        {
            label: 'Amount',
            key: 'amount',
            dataFormat: 'currency',
            mobileHighlight: true,
            render: (value) => `₹${Number(value).toFixed(2)}`,
        },
        { label: 'Collected', key: 'collectedDate', dataFormat: 'date', mobileDate: true },
        { label: 'Updated', key: 'updatedDate', dataFormat: 'date', mobileHide: true },
    ];

    if (loading && collectedCashList.length === 0) {
        return <SkeletonTablePage />;
    }

    return (
        <div className="page-shell">
            <div className="page-header">
                <div>
                    <h1 className="page-heading">Collected cash</h1>
                    <p className="page-sub">Budget inflows for this solution.</p>
                </div>
                <div className="d-flex flex-wrap gap-2">
                    {(accessLevel === 'owner' || accessLevel === 'editor') && (
                        <Button variant="primary" className="touch-btn" onClick={openAddForm}>
                            Add cash
                        </Button>
                    )}
                    <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => fetchAndExport(api, solutionId, 'collected-cash', 'excel')}
                    >
                        <FaDownload className="me-1" /> Excel
                    </Button>
                </div>
            </div>

            <TableUtil
                tableName="All entries"
                tableData={collectedCashList}
                tableHeader={tableHeader}
                tableActions={actions}
                searchKeys={['name']}
                searchText={searchText}
                setSearchText={setSearchText}
                onServerFilterChange={handleServerFilterChange}
                serverPagination={pagination}
                onPageChange={handleDesktopPageChange}
                hasMore={pagination.hasMore}
                loadingMore={loadingMore}
                onLoadMore={handleLoadMore}
            />

            <Modal show={showForm} onHide={closeForm} centered fullscreen="sm-down">
                <Form onSubmit={handleFormSubmit}>
                    <Modal.Header closeButton>
                        <Modal.Title>
                            {editableCash ? 'Edit Collected Cash' : 'Add Collected Cash'}
                        </Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form.Group className="mb-3" controlId="collectedCashName">
                            <Form.Label>Name</Form.Label>
                            <Form.Control
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleFormChange}
                                placeholder="e.g. Nitin, Family contribution"
                                required
                                autoComplete="off"
                            />
                        </Form.Group>

                        <Form.Group className="mb-0" controlId="collectedCashAmount">
                            <Form.Label>Amount</Form.Label>
                            <Form.Control
                                type="text"
                                inputMode="decimal"
                                name="amount"
                                value={formData.amount}
                                onChange={handleFormChange}
                                placeholder="e.g. 5000"
                                required
                                autoComplete="off"
                            />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" type="button" onClick={closeForm}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="primary">
                            {editableCash ? 'Update' : 'Add'}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            <Modal
                show={deleteModal.show}
                onHide={() => setDeleteModal({ show: false, collectedCash: null })}
                centered
            >
                <Modal.Header closeButton>
                    <Modal.Title>Confirm Delete</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    Are you sure you want to delete collected cash entry{' '}
                    <strong>{deleteModal.collectedCash?.name}</strong>?
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        variant="secondary"
                        onClick={() => setDeleteModal({ show: false, collectedCash: null })}
                    >
                        Cancel
                    </Button>
                    <Button variant="danger" onClick={handleDelete}>
                        Delete
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}

export default CollectedCashManager;
