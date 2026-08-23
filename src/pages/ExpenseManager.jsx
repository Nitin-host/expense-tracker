import React, { useState, useEffect, useCallback } from 'react';
import TableUtil from '../utils/TableUtil';
import ExpenseForm from './ExpenseForm';
import { Button, Modal } from '../components/ui';
import { FaEdit, FaTrashAlt, FaEye, FaDownload } from 'react-icons/fa';
import { fetchAndExport } from '../utils/export';
import api from '../api/http';
import { useParams } from 'react-router-dom';
import { useAlert } from '../context/alertContext';
import { SkeletonTablePage } from '../components/Skeleton';

function ExpenseManager() {
    const { id: solutionId } = useParams();

    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ page: 1, limit: 20, totalPages: 1, total: 0, hasMore: false });

    const [showForm, setShowForm] = useState(false);
    const [editableExpense, setEditableExpense] = useState(null);

    const [filters, setFilters] = useState({});
    const [searchText, setSearchText] = useState('');

    const [showImageModal, setShowImageModal] = useState(false);
    const [modalImages, setModalImages] = useState([]);
    const [modalTitle, setModalTitle] = useState('');
    const [deleteModal, setDeleteModal] = useState({ show: false, expense: null });

    const { notifySuccess, notifyError } = useAlert();
    const [accessLevel, setAccessLevel] = useState(null);

    const fetchExpenses = useCallback(async (pageNum = 1, { append = false, filterOverride, searchOverride } = {}) => {
        if (append) setLoadingMore(true);
        else setLoading(true);
        try {
            const activeFilters = filterOverride ?? filters;
            const activeSearch = searchOverride ?? searchText;
            const params = { page: pageNum, limit: 20 };
            if (activeFilters.category) params.category = activeFilters.category;
            if (activeFilters.paymentStatus) params.paymentStatus = activeFilters.paymentStatus;
            if (activeFilters.from) params.from = activeFilters.from;
            if (activeFilters.to) params.to = activeFilters.to;
            if (activeSearch?.trim()) params.q = activeSearch.trim();

            const res = await api.get(`/expense/solution-card/${solutionId}`, { params });
            const list = res.data.expenses || res.data.data || [];
            setExpenses((prev) => {
                if (!append) return list;
                const merged = [...prev, ...list];
                // Cap mobile infinite-scroll memory (~10 pages)
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
            notifyError(err.response?.data?.error?.message || 'Failed to load expenses');
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [solutionId, filters, searchText, notifyError]);

    const handleServerFilterChange = (nextFilters, nextSearch) => {
        if (nextFilters !== undefined) setFilters(nextFilters);
        if (nextSearch !== undefined) setSearchText(nextSearch);
        setPage(1);
        fetchExpenses(1, {
            append: false,
            filterOverride: nextFilters ?? filters,
            searchOverride: nextSearch ?? searchText,
        });
    };

    useEffect(() => {
        if (solutionId) {
            setPage(1);
            fetchExpenses(1, { append: false });
        }
    }, [solutionId]);

    useEffect(() => {
        const mq = window.matchMedia('(max-width: 767.98px)');
        const onChange = (e) => {
            if (!e.matches && solutionId) {
                fetchExpenses(1, { append: false });
            }
        };
        mq.addEventListener('change', onChange);
        return () => mq.removeEventListener('change', onChange);
    }, [solutionId, fetchExpenses]);

    const handleLoadMore = () => {
        if (loadingMore || !pagination.hasMore) return;
        fetchExpenses(page + 1, { append: true });
    };

    const handleDesktopPageChange = (pageNum) => {
        setPage(pageNum);
        fetchExpenses(pageNum, { append: false });
    };

    const openImageModal = async (expense) => {
        try {
            let urls = [];
            if (expense.hasScreenshots || expense.screenshotCount > 0) {
                const res = await api.get(`/expense/${expense._id}`);
                const full = res.data.expense;
                urls = (full.payments || []).flatMap((p) =>
                    p.paymentMethod === 'upi' && p.upiScreenshotUrls ? p.upiScreenshotUrls : []
                );
            } else if (expense.payments) {
                urls = expense.payments.flatMap((p) =>
                    p.paymentMethod === 'upi' && p.upiScreenshotUrls ? p.upiScreenshotUrls : []
                );
            }
            if (!urls.length) {
                notifyError('No screenshots available for this expense');
                return;
            }
            setModalImages(urls);
            setModalTitle(expense.name);
            setShowImageModal(true);
        } catch (err) {
            notifyError(err.response?.data?.error?.message || 'Failed to load screenshots');
        }
    };

    const closeImageModal = () => setShowImageModal(false);

    const categories = Array.from(new Set(expenses.map((e) => e.category).filter(Boolean))).map(
        (cat) => ({ label: cat, value: cat })
    );

    const statuses = Array.from(new Set(expenses.map((e) => e.paymentStatus).filter(Boolean))).map(
        (st) => ({ label: st.replace(/_/g, ' ').toUpperCase(), value: st })
    );

    const filterKeys = [
        { label: 'Category', key: 'category', options: categories },
        { label: 'Payment Status', key: 'paymentStatus', options: statuses },
    ];

    const dateFilters = (
        <div className="d-flex flex-wrap gap-2 align-items-center">
            <input
                type="date"
                className="form-control form-control-sm"
                style={{ maxWidth: 150 }}
                value={filters.from || ''}
                onChange={(e) => handleServerFilterChange({ ...filters, from: e.target.value }, searchText)}
                aria-label="From date"
            />
            <input
                type="date"
                className="form-control form-control-sm"
                style={{ maxWidth: 150 }}
                value={filters.to || ''}
                onChange={(e) => handleServerFilterChange({ ...filters, to: e.target.value }, searchText)}
                aria-label="To date"
            />
        </div>
    );

    const openAddForm = () => {
        setEditableExpense(null);
        setShowForm(true);
    };

    const openEditForm = async (expense) => {
        try {
            const res = await api.get(`/expense/${expense._id}`);
            setEditableExpense(res.data.expense);
            setShowForm(true);
        } catch (err) {
            notifyError(err.response?.data?.error?.message || 'Failed to load expense');
        }
    };

    const closeForm = () => {
        setEditableExpense(null);
        setShowForm(false);
    };

    const handleFormSuccess = () => {
        notifySuccess(`Expense ${editableExpense ? 'updated' : 'added'} successfully!`);
        closeForm();
        fetchExpenses(1, { append: false });
    };

    const handleDelete = async () => {
        const expense = deleteModal.expense;
        if (!expense) return;
        try {
            await api.delete(`/expense/${expense._id}`);
            notifySuccess('Expense deleted successfully!');
            fetchExpenses(1, { append: false });
        } catch (err) {
            notifyError(err.response?.data?.error?.message || 'Failed to delete expense');
        } finally {
            setDeleteModal({ show: false, expense: null });
        }
    };

    const actions = [
        {
            btnTitle: 'View',
            btnClass: 'btn btn-sm btn-outline-info',
            iconComponent: FaEye,
            btnAction: openImageModal,
            isVisible: (expense) =>
                expense.hasScreenshots ||
                expense.screenshotCount > 0 ||
                expense.payments?.some(
                    (p) => p.paymentMethod === 'upi' && p.upiScreenshotUrls?.length > 0
                ),
        },
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
            btnAction: (expense) => setDeleteModal({ show: true, expense }),
            isVisible: () => accessLevel === 'owner' || accessLevel === 'editor',
        },
    ];

    if (loading && expenses.length === 0) {
        return <SkeletonTablePage />;
    }

    const getCardBorderColor = (row) => {
        const advancePaid = row.advancePaid || 0;
        const pendingAmount = row.pendingAmount || 0;
        if (pendingAmount > 0) return '#ea580c';
        if (advancePaid > 0) return '#0f766e';
        return '#64748b';
    };

    const tableHeader = [
        { label: 'Name', key: 'name' },
        { label: 'Category', key: 'category', mobileBadge: true },
        { label: 'Amount', key: 'amount', dataFormat: 'currency', mobileHighlight: true },
        {
            label: 'Paid',
            key: 'advancePaid',
            dataFormat: 'currency',
            mobileHighlight: true,
            render: (value) => (
                <span style={{ color: '#0f766e' }}>₹{Number(value).toFixed(2)}</span>
            ),
        },
        {
            label: 'Pending',
            key: 'pendingAmount',
            dataFormat: 'currency',
            mobileHighlight: true,
            render: (value) => (
                <span style={{ color: Number(value) > 0 ? '#ea580c' : '#64748b' }}>
                    ₹{Number(value).toFixed(2)}
                </span>
            ),
        },
        { label: 'Paid by', key: 'paidBy.name' },
        { label: 'Payment', key: 'payments.paymentMethod' },
        { label: 'Date', key: 'createdAt', dataFormat: 'date' },
    ];

    return (
        <div className="page-shell">
            <div className="page-header">
                <div>
                    <h1 className="page-heading">Expenses</h1>
                    <p className="page-sub">Track payments, pending amounts, and screenshots.</p>
                </div>
                <div className="d-flex flex-wrap gap-2 align-items-center">
                    {(accessLevel === 'owner' || accessLevel === 'editor') && (
                        <Button variant="primary" className="touch-btn" onClick={openAddForm}>
                            Add Expense
                        </Button>
                    )}
                    <Button
                        variant="outline-primary"
                        size="sm"
                        className="touch-btn"
                        onClick={() => fetchAndExport(api, solutionId, 'expenses', 'excel')}
                        title="Export Excel"
                    >
                        <FaDownload className="me-1" /> Excel
                    </Button>
                </div>
            </div>
            {dateFilters}
            <TableUtil
                tableName="All expenses"
                tableData={expenses}
                tableHeader={tableHeader}
                tableActions={actions}
                searchKeys={['name', 'category']}
                filterKeys={filterKeys}
                filters={filters}
                setFilters={setFilters}
                searchText={searchText}
                setSearchText={setSearchText}
                onServerFilterChange={handleServerFilterChange}
                getCardBorderColor={getCardBorderColor}
                serverPagination={pagination}
                onPageChange={handleDesktopPageChange}
                hasMore={pagination.hasMore}
                loadingMore={loadingMore}
                onLoadMore={handleLoadMore}
            />

            <Modal
                show={showImageModal}
                onHide={closeImageModal}
                size="lg"
                centered
                fullscreen="sm-down"
            >
                <Modal.Header closeButton>
                    <Modal.Title>Payment Screenshot — {modalTitle}</Modal.Title>
                </Modal.Header>
                <Modal.Body className="d-flex flex-wrap gap-3 justify-content-center">
                    {modalImages.map((url, index) => (
                        <img
                            key={index}
                            src={url}
                            alt={`Screenshot ${index + 1}`}
                            style={{ maxHeight: '400px', maxWidth: '100%', borderRadius: '10px' }}
                        />
                    ))}
                </Modal.Body>
            </Modal>

            {showForm && (
                <Modal show={showForm} onHide={closeForm} centered fullscreen="sm-down">
                    <Modal.Header closeButton>
                        <Modal.Title>{editableExpense ? 'Edit Expense' : 'Add Expense'}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <ExpenseForm
                            expense={editableExpense}
                            solutionCardId={solutionId}
                            onSuccess={handleFormSuccess}
                            onCancel={closeForm}
                        />
                    </Modal.Body>
                </Modal>
            )}

            <Modal
                show={deleteModal.show}
                onHide={() => setDeleteModal({ show: false, expense: null })}
                centered
            >
                <Modal.Header closeButton>
                    <Modal.Title>Confirm Delete</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    Are you sure you want to delete expense{' '}
                    <strong>{deleteModal.expense?.name}</strong>?
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        variant="secondary"
                        onClick={() => setDeleteModal({ show: false, expense: null })}
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

export default ExpenseManager;
