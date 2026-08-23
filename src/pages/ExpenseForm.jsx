import React, { useState, useEffect, useMemo } from 'react';
import { Form, Button, Row, Col, CloseButton } from '../components/ui';
import api from '../api/http';
import { useAlert } from '../context/alertContext';
import { sanitizeDecimalInput } from '../utils/numericInput';

function ExpenseForm({ expense, solutionCardId, onSuccess, onCancel }) {
    const [name, setName] = useState('');
    const [category, setCategory] = useState('');
    const [amount, setAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [paidAmount, setPaidAmount] = useState('');
    const [upiScreenshots, setUpiScreenshots] = useState([]);
    const [existingScreenshots, setExistingScreenshots] = useState([]);
    const [loading, setLoading] = useState(false);

    const { notifySuccess, notifyError } = useAlert();

    const previewUrls = useMemo(
        () => upiScreenshots.map((file) => URL.createObjectURL(file)),
        [upiScreenshots]
    );

    useEffect(() => {
        return () => {
            previewUrls.forEach((url) => URL.revokeObjectURL(url));
        };
    }, [previewUrls]);

    useEffect(() => {
        if (expense) {
            setName(expense.name || '');
            setCategory(expense.category || '');
            setAmount(String(expense.amount ?? ''));
            setPaidAmount(
                String(
                    expense.payments?.reduce((sum, p) => sum + (p.paidAmount || 0), 0) ?? ''
                )
            );
            setPaymentMethod(
                expense.payments?.length && expense.payments[0].paymentMethod
                    ? expense.payments[0].paymentMethod
                    : 'cash'
            );

            let screenshots = [];
            if (expense.payments) {
                expense.payments.forEach((p) => {
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
    };

    const handleFileChange = (e) => {
        const filesArray = Array.from(e.target.files || []);
        setUpiScreenshots((prev) => [...prev, ...filesArray]);
        e.target.value = '';
    };

    const removeNewImage = (index) => {
        setUpiScreenshots((prev) => prev.filter((_, i) => i !== index));
    };

    const removeExistingImage = (index) => {
        setExistingScreenshots((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (paymentMethod === 'upi') {
            if (upiScreenshots.length === 0 && existingScreenshots.length === 0) {
                notifyError('Please upload at least one UPI screenshot.');
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

            const payments = [
                {
                    paidAmount: Number(paidAmount),
                    paymentMethod,
                    upiScreenshotUrls: existingScreenshots,
                },
            ];
            formData.append('payments', JSON.stringify(payments));

            if (expense) {
                formData.append('expenseId', expense._id);
                formData.append('existingScreenshots', JSON.stringify(existingScreenshots));
            }

            upiScreenshots.forEach((file) =>
                formData.append('upiScreenshots', file)
            );

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
            const message =
                err.response?.data?.error?.message || 'Failed to save expense';
            notifyError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Form onSubmit={handleSubmit} className="et-expense-form">
            <Row className="g-3">
                <Form.Group as={Col} xs={12} md={6} controlId="expenseName">
                    <Form.Label htmlFor="expenseName">Expense Name</Form.Label>
                    <Form.Control
                        id="expenseName"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Hotel booking, Groceries"
                        required
                        autoComplete="off"
                    />
                </Form.Group>

                <Form.Group as={Col} xs={12} md={6} controlId="expenseCategory">
                    <Form.Label htmlFor="expenseCategory">Category</Form.Label>
                    <Form.Control
                        id="expenseCategory"
                        type="text"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        placeholder="e.g. Food, Travel, Supplies"
                        required
                        autoComplete="off"
                    />
                </Form.Group>
            </Row>

            <Row className="g-3">
                <Form.Group as={Col} xs={12} md={6} controlId="expenseAmount">
                    <Form.Label htmlFor="expenseAmount">Amount</Form.Label>
                    <Form.Control
                        id="expenseAmount"
                        type="text"
                        inputMode="decimal"
                        value={amount}
                        onChange={(e) => setAmount(sanitizeDecimalInput(e.target.value))}
                        placeholder="Enter total amount"
                        required
                        autoComplete="off"
                    />
                </Form.Group>

                <Form.Group as={Col} xs={12} md={6} controlId="paidAmount">
                    <Form.Label htmlFor="paidAmount">Paid Amount</Form.Label>
                    <Form.Control
                        id="paidAmount"
                        type="text"
                        inputMode="decimal"
                        value={paidAmount}
                        onChange={(e) => setPaidAmount(sanitizeDecimalInput(e.target.value))}
                        placeholder="Enter amount paid now"
                        required
                        autoComplete="off"
                    />
                </Form.Group>
            </Row>

            <Form.Group controlId="paymentMethod">
                <Form.Label htmlFor="paymentMethod">Payment Method</Form.Label>
                <Form.Select
                    id="paymentMethod"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    required
                >
                    <option value="cash">Cash</option>
                    <option value="upi">UPI</option>
                </Form.Select>
            </Form.Group>

            {paymentMethod === 'upi' && (
                <>
                    <Form.Group controlId="upiScreenshotsUpload">
                        <Form.Label htmlFor="upiScreenshotsUpload">
                            UPI Screenshots (you can add more)
                        </Form.Label>
                        <Form.Control
                            id="upiScreenshotsUpload"
                            type="file"
                            accept="image/*"
                            multiple
                            title="Choose UPI screenshot images"
                            onChange={handleFileChange}
                            required={
                                upiScreenshots.length === 0 &&
                                existingScreenshots.length === 0
                            }
                        />
                    </Form.Group>

                    {!!existingScreenshots.length && (
                        <div className="et-form-gallery">
                            <Form.Label>Existing Screenshots</Form.Label>
                            <div className="et-form-gallery__grid">
                                {existingScreenshots.map((url, idx) => (
                                    <div key={idx} className="et-form-gallery__item">
                                        <img
                                            src={url}
                                            alt={`Existing UPI Screenshot ${idx + 1}`}
                                        />
                                        <CloseButton
                                            className="et-form-gallery__remove"
                                            onClick={() => removeExistingImage(idx)}
                                            aria-label="Remove existing screenshot"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {!!upiScreenshots.length && (
                        <div className="et-form-gallery">
                            <Form.Label>New Screenshots</Form.Label>
                            <div className="et-form-gallery__grid">
                                {upiScreenshots.map((file, idx) => (
                                    <div
                                        key={`${file.name}-${file.lastModified}-${idx}`}
                                        className="et-form-gallery__item"
                                    >
                                        <img
                                            src={previewUrls[idx]}
                                            alt={`UPI Screenshot ${idx + 1}`}
                                            loading="lazy"
                                        />
                                        <CloseButton
                                            className="et-form-gallery__remove"
                                            onClick={() => removeNewImage(idx)}
                                            aria-label="Remove new screenshot"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}

            <div className="et-form-actions">
                <Button type="submit" disabled={loading}>
                    {loading
                        ? 'Saving...'
                        : expense
                          ? 'Update Expense'
                          : 'Add Expense'}
                </Button>

                {onCancel && (
                    <Button variant="secondary" onClick={onCancel} disabled={loading}>
                        Cancel
                    </Button>
                )}
            </div>
        </Form>
    );
}

export default ExpenseForm;
