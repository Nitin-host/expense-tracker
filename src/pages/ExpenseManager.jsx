import React, { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import TableUtil from '../utils/TableUtil';
import { Button, Modal } from '../components/ui';
import { FaEdit, FaTrashAlt, FaEye, FaDownload, FaPlusCircle } from 'react-icons/fa';
import { fetchAndExport } from '../utils/export';
import { formatDate } from '../utils/formatDate';
import api from '../api/http';
import { useParams } from 'react-router-dom';
import { useAlert } from '../context/alertContext';
import { SkeletonTablePage } from '../components/Skeleton';

const ExpenseForm = lazy(() => import('./ExpenseForm'));
const AddPaymentForm = lazy(() => import('./AddPaymentForm'));

function ExpenseManager() {
    const { id: solutionId } = useParams();

    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ page: 1, limit: 20, totalPages: 1, total: 0, hasMore: false });

    const [showForm, setShowForm] = useState(false);
    const [editableExpense, setEditableExpense] = useState(null);
    const [paymentModal, setPaymentModal] = useState({ show: false, expense: null });

    const [filters, setFilters] = useState({});
    const [searchText, setSearchText] = useState('');

    const [showImageModal, setShowImageModal] = useState(false);
    const [modalImages, setModalImages] = useState([]);
    const [modalTitle, setModalTitle] = useState('');
    const [deleteModal, setDeleteModal] = useState({ show: false, expense: null });

    const { notifySuccess, notifyError } = useAlert();
    const [accessLevel, setAccessLevel] = useState(null);

    const filtersRef = useRef(filters);
    const searchTextRef = useRef(searchText);
    const notifyErrorRef = useRef(notifyError);
    const abortRef = useRef(null);
    const filterDebounceRef = useRef(null);
    filtersRef.current = filters;
    searchTextRef.current = searchText;
    notifyErrorRef.current = notifyError;

    const fetchExpenses = useCallback(async (pageNum = 1, { append = false, filterOverride, searchOverride } = {}) => {
        if (abortRef.current) abortRef.current.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        if (append) setLoadingMore(true);
        else setLoading(true);
        try {
            const activeFilters = filterOverride ?? filtersRef.current;
            const activeSearch = searchOverride ?? searchTextRef.current;
            const params = { page: pageNum, limit: 20 };
            if (activeFilters.category) params.category = activeFilters.category;
            if (activeFilters.paymentStatus) params.paymentStatus = activeFilters.paymentStatus;
            if (activeFilters.from) params.from = activeFilters.from;
            if (activeFilters.to) params.to = activeFilters.to;
            if (activeSearch?.trim()) params.q = activeSearch.trim();

            const res = await api.get(`/expense/solution-card/${solutionId}`, {
                params,
                signal: controller.signal,
            });
            if (controller.signal.aborted) return;
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
            if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') return;
            notifyErrorRef.current(err.response?.data?.error?.message || 'Failed to load expenses');
        } finally {
            if (!controller.signal.aborted) {
                setLoading(false);
                setLoadingMore(false);
            }
        }
    }, [solutionId]);

    const handleServerFilterChange = (nextFilters, nextSearch) => {
        if (nextFilters !== undefined) setFilters(nextFilters);
        if (nextSearch !== undefined) setSearchText(nextSearch);
        setPage(1);

        const runFetch = () => {
            fetchExpenses(1, {
                append: false,
                filterOverride: nextFilters ?? filtersRef.current,
                searchOverride: nextSearch ?? searchTextRef.current,
            });
        };

        const hasDateFilter =
            (nextFilters ?? filtersRef.current)?.from || (nextFilters ?? filtersRef.current)?.to;
        if (filterDebounceRef.current) clearTimeout(filterDebounceRef.current);
        if (hasDateFilter) {
            filterDebounceRef.current = setTimeout(runFetch, 400);
        } else {
            runFetch();
        }
    };

    useEffect(() => {
        if (solutionId) {
            setPage(1);
            fetchExpenses(1, { append: false });
        }
        return () => {
            if (abortRef.current) abortRef.current.abort();
            if (filterDebounceRef.current) clearTimeout(filterDebounceRef.current);
        };
    }, [solutionId, fetchExpenses]);

    const fetchRef = useRef(fetchExpenses);
    fetchRef.current = fetchExpenses;

    useEffect(() => {
        const mq = window.matchMedia('(max-width: 767.98px)');
        const onChange = (e) => {
            if (!e.matches && solutionId) {
                fetchRef.current(1, { append: false });
            }
        };
        mq.addEventListener('change', onChange);
        return () => mq.removeEventListener('change', onChange);
    }, [solutionId]);

    const handleLoadMore = () => {
        if (loadingMore || !pagination.hasMore) return;
        fetchExpenses(page + 1, {
            append: true,
            filterOverride: filters,
            searchOverride: searchText,
        });
    };

    const handleDesktopPageChange = (pageNum) => {
        setPage(pageNum);
        fetchExpenses(pageNum, {
            append: false,
            filterOverride: filters,
            searchOverride: searchText,
        });
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
        <div className="et-date-filter-bar">
            <label className="et-date-filter">
                <span className="et-date-filter__label">From</span>
                <input
                    type="date"
                    className="et-date-filter__input form-control form-control-sm"
                    value={filters.from || ''}
                    onChange={(e) => handleServerFilterChange({ ...filters, from: e.target.value }, searchText)}
                    aria-label="From date"
                />
                <span className={`et-date-filter__display${filters.from ? '' : ' et-date-filter__display--empty'}`} aria-hidden>
                    {filters.from ? formatDate(filters.from) : 'dd-mm-yyyy'}
                </span>
            </label>
            <label className="et-date-filter">
                <span className="et-date-filter__label">To</span>
                <input
                    type="date"
                    className="et-date-filter__input form-control form-control-sm"
                    value={filters.to || ''}
                    onChange={(e) => handleServerFilterChange({ ...filters, to: e.target.value }, searchText)}
                    aria-label="To date"
                />
                <span className={`et-date-filter__display${filters.to ? '' : ' et-date-filter__display--empty'}`} aria-hidden>
                    {filters.to ? formatDate(filters.to) : 'dd-mm-yyyy'}
                </span>
            </label>
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

    const openAddPayment = async (expense) => {
        try {
            const res = await api.get(`/expense/${expense._id}`);
            const full = res.data.expense;
            if (!(full.pendingAmount > 0)) {
                notifyError('This expense has no pending amount.');
                return;
            }
            setPaymentModal({ show: true, expense: full });
        } catch (err) {
            notifyError(err.response?.data?.error?.message || 'Failed to load expense');
        }
    };

    const closeAddPayment = () => setPaymentModal({ show: false, expense: null });

    const handlePaymentSuccess = () => {
        closeAddPayment();
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
            btnTitle: 'Add Payment',
            btnClass: 'btn btn-sm btn-outline-primary',
            iconComponent: FaPlusCircle,
            btnAction: openAddPayment,
            isVisible: (expense) =>
                (accessLevel === 'owner' || accessLevel === 'editor') &&
                Number(expense.pendingAmount || 0) > 0,
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
        { label: 'Date', key: 'createdAt', dataFormat: 'date', mobileDate: true },
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
            <TableUtil
                tableName="All expenses"
                toolbarExtra={dateFilters}
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
                        <Suspense fallback={<div className="p-3 text-muted">Loading form…</div>}>
                            <ExpenseForm
                                expense={editableExpense}
                                solutionCardId={solutionId}
                                onSuccess={handleFormSuccess}
                                onCancel={closeForm}
                            />
                        </Suspense>
                    </Modal.Body>
                </Modal>
            )}

            {paymentModal.show && paymentModal.expense && (
                <Modal show={paymentModal.show} onHide={closeAddPayment} centered fullscreen="sm-down">
                    <Modal.Header closeButton>
                        <Modal.Title>Add Payment</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Suspense fallback={<div className="p-3 text-muted">Loading form…</div>}>
                            <AddPaymentForm
                                expense={paymentModal.expense}
                                onSuccess={handlePaymentSuccess}
                                onCancel={closeAddPayment}
                            />
                        </Suspense>
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
