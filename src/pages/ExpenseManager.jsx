import React, { useState, useEffect } from 'react';
import TableUtil from '../utils/TableUtil';
import ExpenseForm from './ExpenseForm';
import { Button, Modal, Spinner } from 'react-bootstrap';
import { FaEdit, FaTrashAlt, FaEye } from 'react-icons/fa';
import api from '../api/http';
import { useParams } from 'react-router-dom';
import { useAlert } from '../utils/AlertUtil';  // Import alert hook

function ExpenseManager() {
    const { id: solutionId } = useParams();

    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [showForm, setShowForm] = useState(false);
    const [editableExpense, setEditableExpense] = useState(null);

    const [filters, setFilters] = useState({});
    const [searchText, setSearchText] = useState('');

    const [showImageModal, setShowImageModal] = useState(false);
    const [modalImages, setModalImages] = useState([]);
    const [modalTitle, setModalTitle] = useState('');
    const [deleteModal, setDeleteModal] = useState({ show: false, expense: null });

    const { notifySuccess, notifyError } = useAlert(); // Destructure alert functions

    const openImageModal = (expense) => {
        const urls = expense.payments.flatMap(p =>
            p.paymentMethod === 'upi' && p.upiScreenshotUrls ? p.upiScreenshotUrls : []
        );
        if (!urls.length) return;
        setModalImages(urls);
        setModalTitle(expense.name);
        setShowImageModal(true);
    };

    const closeImageModal = () => setShowImageModal(false);

    const categories = Array.from(new Set(expenses.map(e => e.category).filter(Boolean)))
        .map(cat => ({ label: cat, value: cat }));

    const statuses = Array.from(new Set(expenses.map(e => e.paymentStatus).filter(Boolean)))
        .map(st => ({ label: st.replace(/_/g, ' ').toUpperCase(), value: st }));

    const filterKeys = [
        { label: "Category", key: "category", options: categories },
        { label: "Payment Status", key: "paymentStatus", options: statuses },
    ];

    useEffect(() => {
        async function fetchExpenses() {
            setLoading(true);
            setError('');
            try {
                const res = await api.get(`/expense/solution-card/${solutionId}`);
                setExpenses(res.data.expenses || []);
            } catch {
                notifyError('Failed to load expenses');
            } finally {
                setLoading(false);
            }
        }
        if (solutionId) fetchExpenses();
    }, [solutionId, notifyError]);

    const openAddForm = () => {
        setEditableExpense(null);
        setShowForm(true);
    };

    const openEditForm = (expense) => {
        setEditableExpense(expense);
        setShowForm(true);
    };

    const closeForm = () => {
        setEditableExpense(null);
        setShowForm(false);
    };

    const handleFormSuccess = (expense) => {
        setExpenses(prev => {
            const index = prev.findIndex(e => e._id === expense._id);
            if (index === -1) return [expense, ...prev];
            const updated = [...prev];
            updated[index] = expense;
            return updated;
        });
        notifySuccess(`Expense ${editableExpense ? 'updated' : 'added'} successfully!`);
        closeForm();
    };

    const handleDelete = async () => {
        const expense = deleteModal.expense;
        if (!expense) return;
        try {
            await api.delete(`/expense/${expense._id}`);
            setExpenses(prev => prev.filter(e => e._id !== expense._id));
            notifySuccess('Expense deleted successfully!');
        } catch {
            notifyError('Failed to delete expense');
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
            isVisible: expense => expense.payments.some(p => p.paymentMethod === 'upi' && p.upiScreenshotUrls?.length > 0),
        },
        {
            btnTitle: 'Edit',
            btnClass: 'btn btn-sm btn-outline-primary',
            iconComponent: FaEdit,
            btnAction: openEditForm,
        },
        {
            btnTitle: 'Delete',
            btnClass: 'btn btn-sm btn-outline-danger',
            iconComponent: FaTrashAlt,
            btnAction: (expense) => setDeleteModal({ show: true, expense }),
        }
    ];

    if (loading) return <div className="text-center my-5"><Spinner animation="border" variant="primary" role="status" /></div>;
    if (error) return <p className="text-danger">{error}</p>;

    const getCardBorderColor = (row) => {
        const advancePaid = row.advancePaid || 0;
        const pendingAmount = row.pendingAmount || 0;
        if (pendingAmount > 0) return '#f39c12'; // orange for pending
        if (advancePaid > 0) return '#1aaa55';    // green for paid
        return '#888b8e';                         // neutral
    };

    const tableHeader = [
        { label: 'Name', key: 'name' },
        { label: 'Category', key: 'category' },
        { label: 'Amount', key: 'amount', dataFormat: 'currency' },
        {
            label: 'Paid',
            key: 'advancePaid',
            dataFormat: 'currency',
            render: (value) => (
                <span style={{ color: '#1aaa55' }}>
                    ₹{Number(value).toFixed(2)}
                </span>
            )
        },
        {
            label: 'Pending',
            key: 'pendingAmount',
            dataFormat: 'currency',
            render: (value) => (
                <span style={{ color: Number(value) > 0 ? '#f39c12' : '#888b8e' }}>
                    ₹{Number(value).toFixed(2)}
                </span>
            )
        },
        { label: 'Paid By', key: 'paidBy.name' },
        { label: 'Payment Mode', key: 'payments.paymentMethod' },
        { label: 'CreatedAt', key: 'createdAt', dataFormat: 'date' }
    ];

    return (
        <>
            <Button variant="primary" className="mb-3" onClick={openAddForm}>
                Add Expense
            </Button>

            <TableUtil
                tableName="Expenses"
                tableData={expenses}
                tableHeader={tableHeader}
                tableActions={actions}
                searchKeys={['name', 'category']}
                filterKeys={filterKeys}
                filters={filters}
                setFilters={setFilters}
                searchText={searchText}
                setSearchText={setSearchText}
                getCardBorderColor={getCardBorderColor}
            />

            <Modal show={showImageModal} onHide={closeImageModal} size="lg" centered>
                <Modal.Header closeButton>
                    <Modal.Title>Payment Screenshot - {modalTitle}</Modal.Title>
                </Modal.Header>
                <Modal.Body className="d-flex flex-wrap gap-3 justify-content-center">
                    {modalImages.map((url, index) => (
                        <img
                            key={index}
                            src={url}
                            alt={`Screenshot ${index + 1}`}
                            style={{ maxHeight: '400px', maxWidth: '100%', borderRadius: '8px' }}
                        />
                    ))}
                </Modal.Body>
            </Modal>

            {showForm && (
                <Modal show={showForm} onHide={closeForm} centered>
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

            <Modal show={deleteModal.show} onHide={() => setDeleteModal({ show: false, expense: null })} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Confirm Delete</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    Are you sure you want to delete expense{' '}
                    <strong>{deleteModal.expense?.name}</strong>?
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setDeleteModal({ show: false, expense: null })}>
                        Cancel
                    </Button>
                    <Button variant="danger" onClick={handleDelete}>
                        Delete
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}

export default ExpenseManager;
