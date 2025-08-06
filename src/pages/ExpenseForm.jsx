import React, { useState, useEffect } from 'react';
import { Form, Button, Row, Col, Alert, CloseButton } from 'react-bootstrap';
import api from '../api/http';
import { useAlert } from '../utils/AlertUtil';  // Import your alert hook

function ExpenseForm({ expense, solutionCardId, onSuccess, onCancel }) {
    const [name, setName] = useState('');
    const [category, setCategory] = useState('');
    const [amount, setAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [paidAmount, setPaidAmount] = useState('');
    const [upiScreenshots, setUpiScreenshots] = useState([]);  // New files selected
    const [existingScreenshots, setExistingScreenshots] = useState([]); // For edit: existing screenshot URLs with public IDs
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { notifySuccess, notifyError } = useAlert();

    useEffect(() => {
        if (expense) {
            setName(expense.name || '');
            setCategory(expense.category || '');
            setAmount(String(expense.amount ?? ''));
            setPaidAmount(String(expense.payments?.reduce((sum, p) => sum + (p.paidAmount || 0), 0) ?? ''));
            setPaymentMethod(expense.payments?.length && expense.payments[0].paymentMethod ? expense.payments[0].paymentMethod : 'cash');
            let screenshots = [];
            if (expense.payments) {
                expense.payments.forEach(p => {
                    if (p.upiScreenshotUrls && p.upiScreenshotUrls.length) {
                        screenshots = screenshots.concat(p.upiScreenshotUrls);
                    }
                });
            }
            setExistingScreenshots(screenshots);
            setUpiScreenshots([]);
        } else {
            resetForm();
        }
    }, [expense]);

    const resetForm = () => {
        setName('');
        setCategory('');
        setAmount('');
        setPaymentMethod('cash');
        setPaidAmount('');
        setUpiScreenshots([]);
        setExistingScreenshots([]);
        setError('');
    };

    const handleFileChange = (e) => {
        const filesArray = Array.from(e.target.files);
        setUpiScreenshots(prev => [...prev, ...filesArray]);
    };

    const removeNewImage = (index) => {
        setUpiScreenshots(prev => prev.filter((_, i) => i !== index));
    };

    const removeExistingImage = (index) => {
        setExistingScreenshots(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (paymentMethod === 'upi') {
            if (upiScreenshots.length === 0 && existingScreenshots.length === 0) {
                setError('Please upload at least one UPI screenshot.');
                return;
            }
        }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('name', name);
            formData.append('category', category);
            formData.append('amount', amount);
            formData.append('paymentMethod', paymentMethod);
            formData.append('paidAmount', paidAmount);
            formData.append('solutionCard', solutionCardId);

            const payments = [{
                paidAmount: Number(paidAmount),
                paymentMethod,
                upiScreenshotUrls: existingScreenshots,
            }];
            formData.append('payments', JSON.stringify(payments));

            if (expense) {
                formData.append('expenseId', expense._id);
                formData.append('existingScreenshots', JSON.stringify(existingScreenshots));
            }

            upiScreenshots.forEach(file => formData.append('upiScreenshots', file));

            let res;
            if (expense) {
                res = await api.put(`/expense/${expense._id}`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
            } else {
                res = await api.post('/expense', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
            }

            resetForm();
            notifySuccess(expense ? 'Expense updated successfully!' : 'Expense added successfully!');
            if (onSuccess) onSuccess(res.data.expense);
        } catch (err) {
            const message = err.response?.data?.message || err.message || 'Failed to save expense';
            setError(message);
            notifyError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Form onSubmit={handleSubmit}>
            {error && <Alert variant="danger">{error}</Alert>}

            <Row className="mb-3">
                <Form.Group as={Col} controlId="expenseName">
                    <Form.Label>Expense Name</Form.Label>
                    <Form.Control
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        required
                    />
                </Form.Group>

                <Form.Group as={Col} controlId="expenseCategory">
                    <Form.Label>Category</Form.Label>
                    <Form.Control
                        type="text"
                        value={category}
                        onChange={e => setCategory(e.target.value)}
                        required
                    />
                </Form.Group>
            </Row>

            <Row className="mb-3">
                <Form.Group as={Col} controlId="expenseAmount">
                    <Form.Label>Amount</Form.Label>
                    <Form.Control
                        type="number"
                        min="0"
                        step="0.01"
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        required
                    />
                </Form.Group>

                <Form.Group as={Col} controlId="paidAmount">
                    <Form.Label>Paid Amount</Form.Label>
                    <Form.Control
                        type="number"
                        min="0"
                        step="0.01"
                        value={paidAmount}
                        onChange={e => setPaidAmount(e.target.value)}
                        required
                    />
                </Form.Group>
            </Row>

            <Form.Group className="mb-3" controlId="paymentMethod">
                <Form.Label>Payment Method</Form.Label>
                <Form.Select
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value)}
                    required
                >
                    <option value="cash">Cash</option>
                    <option value="upi">UPI</option>
                </Form.Select>
            </Form.Group>

            {(paymentMethod === 'upi') && (
                <>
                    <Form.Group className="mb-3" controlId="upiScreenshotsUpload">
                        <Form.Label>UPI Screenshots (you can add more)</Form.Label>
                        <Form.Control
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleFileChange}
                            required={upiScreenshots.length === 0 && existingScreenshots.length === 0}
                        />
                    </Form.Group>

                    {!!existingScreenshots.length && (
                        <>
                            <Form.Label>Existing Screenshots</Form.Label>
                            <div className="mb-3 d-flex flex-wrap gap-3">
                                {existingScreenshots.map((url, idx) => (
                                    <div key={idx} style={{ position: 'relative', display: 'inline-block' }}>
                                        <img
                                            src={url}
                                            alt={`Existing UPI Screenshot ${idx + 1}`}
                                            style={{ width: '120px', height: '120px', objectFit: 'cover' }}
                                        />
                                        <CloseButton
                                            style={{ position: 'absolute', top: 0, right: 0, zIndex: 1 }}
                                            onClick={() => removeExistingImage(idx)}
                                            aria-label="Remove existing screenshot"
                                        />
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    {!!upiScreenshots.length && (
                        <>
                            <Form.Label>New Screenshots</Form.Label>
                            <div className="mb-3 d-flex flex-wrap gap-3">
                                {upiScreenshots.map((file, idx) => (
                                    <div key={idx} style={{ position: 'relative', display: 'inline-block' }}>
                                        <img
                                            src={URL.createObjectURL(file)}
                                            alt={`UPI Screenshot ${idx + 1}`}
                                            style={{ width: '120px', height: '120px', objectFit: 'cover' }}
                                        />
                                        <CloseButton
                                            style={{ position: 'absolute', top: 0, right: 0, zIndex: 1 }}
                                            onClick={() => removeNewImage(idx)}
                                            aria-label="Remove new screenshot"
                                        />
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </>
            )}

            <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : (expense ? 'Update Expense' : 'Add Expense')}
            </Button>

            {onCancel && (
                <Button variant="secondary" onClick={onCancel} className="ms-2" disabled={loading}>
                    Cancel
                </Button>
            )}
        </Form>
    );
}

export default ExpenseForm;
