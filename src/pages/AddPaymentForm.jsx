import React, { useEffect, useMemo, useState } from 'react';
import { Form, Button, Row, Col, CloseButton } from '../components/ui';
import api from '../api/http';
import { useAlert } from '../context/alertContext';
import { sanitizeDecimalInput } from '../utils/numericInput';

function AddPaymentForm({ expense, onSuccess, onCancel }) {
    const pending = Number(expense?.pendingAmount || 0);
    const [paidAmount, setPaidAmount] = useState(pending > 0 ? String(pending) : '');
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [upiScreenshots, setUpiScreenshots] = useState([]);
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
        setPaidAmount(pending > 0 ? String(pending) : '');
        setPaymentMethod('cash');
        setUpiScreenshots([]);
    }, [expense?._id, pending]);

    const handleFileChange = (e) => {
        const filesArray = Array.from(e.target.files || []);
        setUpiScreenshots((prev) => [...prev, ...filesArray]);
        e.target.value = '';
    };

    const removeImage = (index) => {
        setUpiScreenshots((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const amountNum = Number(paidAmount);
        if (!amountNum || amountNum <= 0) {
            notifyError('Enter a valid payment amount.');
            return;
        }
        if (amountNum > pending) {
            notifyError(`Amount cannot exceed pending ₹${pending.toFixed(2)}.`);
            return;
        }
        if (paymentMethod === 'upi' && upiScreenshots.length === 0) {
            notifyError('Please upload at least one UPI screenshot.');
            return;
        }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('paidAmount', String(amountNum));
            formData.append('paymentMethod', paymentMethod);
            upiScreenshots.forEach((file) => formData.append('upiScreenshots', file));

            const res = await api.post(`/expense/${expense._id}/add-payment`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            notifySuccess('Payment added successfully!');
            if (onSuccess) onSuccess(res.data.expense);
        } catch (err) {
            notifyError(
                err.response?.data?.error?.message ||
                    err.response?.data?.message ||
                    'Failed to add payment'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <Form onSubmit={handleSubmit} className="et-expense-form">
            <div className="et-add-payment-summary">
                <div>
                    <span className="et-add-payment-summary__label">Expense</span>
                    <strong>{expense?.name}</strong>
                </div>
                <div>
                    <span className="et-add-payment-summary__label">Total</span>
                    <span>₹{Number(expense?.amount || 0).toFixed(2)}</span>
                </div>
                <div>
                    <span className="et-add-payment-summary__label">Already paid</span>
                    <span style={{ color: '#0f766e' }}>
                        ₹{Number(expense?.advancePaid || 0).toFixed(2)}
                    </span>
                </div>
                <div>
                    <span className="et-add-payment-summary__label">Pending</span>
                    <span style={{ color: '#ea580c' }}>₹{pending.toFixed(2)}</span>
                </div>
            </div>

            <Row className="g-3">
                <Form.Group as={Col} xs={12} md={6} controlId="addPaidAmount">
                    <Form.Label htmlFor="addPaidAmount">Amount to pay now</Form.Label>
                    <Form.Control
                        id="addPaidAmount"
                        type="text"
                        inputMode="decimal"
                        value={paidAmount}
                        onChange={(e) => setPaidAmount(sanitizeDecimalInput(e.target.value))}
                        placeholder={`Max ₹${pending.toFixed(2)}`}
                        required
                        autoComplete="off"
                    />
                </Form.Group>

                <Form.Group as={Col} xs={12} md={6} controlId="addPaymentMethod">
                    <Form.Label htmlFor="addPaymentMethod">Payment Method</Form.Label>
                    <Form.Select
                        id="addPaymentMethod"
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        required
                    >
                        <option value="cash">Cash</option>
                        <option value="upi">UPI</option>
                    </Form.Select>
                </Form.Group>
            </Row>

            {paymentMethod === 'upi' && (
                <>
                    <Form.Group controlId="addUpiScreenshots">
                        <Form.Label htmlFor="addUpiScreenshots">
                            UPI Screenshot (required)
                        </Form.Label>
                        <Form.Control
                            id="addUpiScreenshots"
                            type="file"
                            accept="image/*"
                            multiple
                            title="Choose UPI screenshot images"
                            onChange={handleFileChange}
                            required={upiScreenshots.length === 0}
                        />
                    </Form.Group>

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
                                            onClick={() => removeImage(idx)}
                                            aria-label="Remove screenshot"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}

            <div className="et-form-actions">
                <Button type="submit" disabled={loading || pending <= 0}>
                    {loading ? 'Saving...' : 'Add Payment'}
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

export default AddPaymentForm;
