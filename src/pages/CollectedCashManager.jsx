import React, { useState, useEffect } from 'react';
import TableUtil from '../utils/TableUtil';
import { Button, Modal, Form, Alert, Spinner } from 'react-bootstrap';
import { FaEdit, FaTrashAlt } from 'react-icons/fa';
import api from '../api/http';
import { useParams } from 'react-router-dom';
import { useAlert } from '../utils/AlertUtil'; // import the alert hook

function CollectedCashManager() {
    const { id: solutionId } = useParams();

    const [collectedCashList, setCollectedCashList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(''); // only for form validation errors

    const [showForm, setShowForm] = useState(false);
    const [editableCash, setEditableCash] = useState(null);

    const [deleteModal, setDeleteModal] = useState({ show: false, collectedCash: null });

    const [formData, setFormData] = useState({
        name: '',
        amount: '',
    });

    const { notifySuccess, notifyError } = useAlert(); // get notify functions

    // Fetch collected cash entries for solution
    useEffect(() => {
        async function fetchCollectedCash() {
            setLoading(true);
            setError('');
            try {
                const res = await api.get(`/collected-cash/solution/${solutionId}`);
                setCollectedCashList(res.data.collectedCash || []);
            } catch {
                notifyError('Failed to load collected cash data');
            } finally {
                setLoading(false);
            }
        }
        if (solutionId) fetchCollectedCash();
    }, [solutionId, notifyError]);

    const openAddForm = () => {
        setEditableCash(null);
        setFormData({ name: '', amount: '' });
        setError('');
        setShowForm(true);
    };

    const openEditForm = (cash) => {
        setEditableCash(cash);
        setFormData({
            name: cash.name,
            amount: cash.amount.toString(),
        });
        setError('');
        setShowForm(true);
    };

    const closeForm = () => {
        setEditableCash(null);
        setShowForm(false);
        setFormData({ name: '', amount: '' });
        setError('');
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.name.trim() || !formData.amount.trim()) {
            setError('Name and Amount are required.');
            return;
        }

        if (isNaN(formData.amount) || Number(formData.amount) <= 0) {
            setError('Amount must be a positive number.');
            return;
        }

        try {
            let res;
            if (editableCash) {
                // Update existing
                res = await api.put(`/collected-cash/${editableCash._id}`, {
                    name: formData.name.trim(),
                    amount: Number(formData.amount),
                });
                setCollectedCashList(prev => {
                    const index = prev.findIndex(c => c._id === editableCash._id);
                    if (index === -1) return prev;
                    const updated = [...prev];
                    updated[index] = res.data.collectedCash;
                    return updated;
                });

                notifySuccess('Collected cash updated successfully!');
            } else {
                // Create new
                res = await api.post('/collected-cash', {
                    solutionCardId: solutionId,
                    name: formData.name.trim(),
                    amount: Number(formData.amount),
                });
                setCollectedCashList(prev => [res.data.collectedCash, ...prev]);

                notifySuccess('Collected cash added successfully!');
            }

            closeForm();
        } catch {
            notifyError('Failed to save collected cash.');
        }
    };

    const handleDelete = async () => {
        const cash = deleteModal.collectedCash;
        if (!cash) return;

        try {
            await api.delete(`/collected-cash/${cash._id}`);
            setCollectedCashList(prev => prev.filter(c => c._id !== cash._id));
            notifySuccess('Collected cash entry deleted successfully!');
        } catch {
            notifyError('Failed to delete collected cash entry.');
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
        },
        {
            btnTitle: 'Delete',
            btnClass: 'btn btn-sm btn-outline-danger',
            iconComponent: FaTrashAlt,
            btnAction: (cash) => setDeleteModal({ show: true, collectedCash: cash }),
        },
    ];

    const tableHeader = [
        { label: 'Name', key: 'name' },
        {
            label: 'Amount',
            key: 'amount',
            dataFormat: 'currency',
            render: (value) => `₹${Number(value).toFixed(2)}`,
        },
        { label: 'Collected Date', key: 'collectedDate', dataFormat: 'date' },
        { label: 'Updated Date', key: 'updatedDate', dataFormat: 'date' }
    ];

    if (loading) return <div className="text-center my-5"><Spinner animation="border" variant="primary" role="status" /></div>;
    if (error) return <Alert variant="danger">{error}</Alert>;

    return (
        <>
            <Button variant="primary" className="mb-3" onClick={openAddForm}>
                Add Collected Cash
            </Button>

            <TableUtil
                tableName="Collected Cash"
                tableData={collectedCashList}
                tableHeader={tableHeader}
                tableActions={actions}
                searchKeys={['name']}
            />

            <Modal show={showForm} onHide={closeForm} centered>
                <Modal.Header closeButton>
                    <Modal.Title>{editableCash ? 'Edit Collected Cash' : 'Add Collected Cash'}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleFormSubmit}>
                        {error && <Alert variant="danger">{error}</Alert>}
                        <Form.Group className="mb-3" controlId="collectedCashName">
                            <Form.Label>Name</Form.Label>
                            <Form.Control
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleFormChange}
                                placeholder="Enter name"
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-3" controlId="collectedCashAmount">
                            <Form.Label>Amount</Form.Label>
                            <Form.Control
                                type="number"
                                step="0.01"
                                min="0"
                                name="amount"
                                value={formData.amount}
                                onChange={handleFormChange}
                                placeholder="Enter amount"
                                required
                            />
                        </Form.Group>

                        <div className="d-flex justify-content-end">
                            <Button variant="secondary" onClick={closeForm} className="me-2">
                                Cancel
                            </Button>
                            <Button type="submit" variant="primary">
                                {editableCash ? 'Update' : 'Add'}
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
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
                    <Button variant="secondary" onClick={() => setDeleteModal({ show: false, collectedCash: null })}>
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

export default CollectedCashManager;
