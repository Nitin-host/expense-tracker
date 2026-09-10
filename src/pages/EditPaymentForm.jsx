import React, { useEffect, useMemo, useState } from 'react';
import { Form, Button, Row, Col, CloseButton } from '../components/ui';
import api from '../api/http';
import { useAlert } from '../context/alertContext';
import { sanitizeDecimalInput } from '../utils/numericInput';

function EditPaymentForm({ expense, paymentIndex, onSuccess, onCancel }) {
    const payment = expense?.payments?.[paymentIndex];
    const billAmount = Number(expense?.amount || 0);
    const otherPaid = (expense?.payments || []).reduce((sum, p, i) => {
        if (i === paymentIndex) return sum;
        return sum + Number(p.paidAmount || 0);
    }, 0);
    const maxAllowed = Math.max(billAmount - otherPaid, 0);

    const [paidAmount, setPaidAmount] = useState(
        payment ? String(payment.paidAmount ?? '') : ''
    );
    const [paymentMethod, setPaymentMethod] = useState(payment?.paymentMethod || 'cash');
    const [existingScreenshots, setExistingScreenshots] = useState(
        payment?.upiScreenshotUrls ? [...payment.upiScreenshotUrls] : []
    );
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
        if (!payment) return;
        setPaidAmount(String(payment.paidAmount ?? ''));
        setPaymentMethod(payment.paymentMethod || 'cash');
        setExistingScreenshots(
            Array.isArray(payment.upiScreenshotUrls) ? [...payment.upiScreenshotUrls] : []
        );
        setUpiScreenshots([]);
    }, [payment, paymentIndex, expense?._id]);

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
        if (!expense?._id || paymentIndex == null || !payment) {
            notifyError('Payment not found.');
            return;
        }

        const amountNum = Number(paidAmount);
        if (!amountNum || amountNum <= 0) {
            notifyError('Enter a valid payment amount.');
            return;
        }
        if (amountNum - maxAllowed > 0.005) {
            notifyError(`Amount cannot exceed ₹${maxAllowed.toFixed(2)} for this bill.`);
            return;
        }
        if (
            paymentMethod === 'upi' &&
            upiScreenshots.length === 0 &&
            existingScreenshots.length === 0
        ) {
            notifyError('Please keep or upload at least one UPI screenshot.');
            return;
        }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('paidAmount', String(amountNum));
            formData.append('paymentMethod', paymentMethod);
            formData.append('existingScreenshots', JSON.stringify(existingScreenshots));
            if (paymentMethod === 'upi') {
                upiScreenshots.forEach((file) => formData.append('upiScreenshots', file));
            }

            const res = await api.put(
                `/expense/${expense._id}/payments/${paymentIndex}`,
                formData,
                { headers: { 'Content-Type': 'multipart/form-data' } }
            );

            notifySuccess('Payment updated successfully!');
            if (onSuccess) onSuccess(res.data.expense);
        } catch (err) {
            notifyError(
                err.response?.data?.error?.message ||
                    err.response?.data?.message ||
                    'Failed to update payment'
            );
        } finally {
            setLoading(false);
        }
    };

    if (!payment) {
        return <p className="text-muted mb-0">Payment installment not found.</p>;
    }

    return (
        <Form onSubmit={handleSubmit} className="et-expense-form">
            <div className="et-add-payment-summary">
                <div>
                    <span className="et-add-payment-summary__label">Expense</span>
                    <strong>{expense?.name}</strong>
                </div>
                <div>
                    <span className="et-add-payment-summary__label">Bill</span>
                    <span>₹{billAmount.toFixed(2)}</span>
                </div>
                <div>
                    <span className="et-add-payment-summary__label">Other payments</span>
                    <span>₹{Number(otherPaid).toFixed(2)}</span>
                </div>
                <div>
                    <span className="et-add-payment-summary__label">Max for this row</span>
                    <span style={{ color: '#0f766e' }}>₹{maxAllowed.toFixed(2)}</span>
                </div>
            </div>

            <Row className="g-3">
                <Form.Group as={Col} xs={12} md={6} controlId="editPaidAmount">
                    <Form.Label htmlFor="editPaidAmount">Paid amount</Form.Label>
                    <Form.Control
                        id="editPaidAmount"
                        type="text"
                        inputMode="decimal"
                        value={paidAmount}
                        onChange={(e) => setPaidAmount(sanitizeDecimalInput(e.target.value))}
                        placeholder={`Max ₹${maxAllowed.toFixed(2)}`}
                        required
                        autoComplete="off"
                    />
                </Form.Group>

                <Form.Group as={Col} xs={12} md={6} controlId="editPaymentMethod">
                    <Form.Label htmlFor="editPaymentMethod">Payment Method</Form.Label>
                    <Form.Select
                        id="editPaymentMethod"
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        required
                    >
                        <option value="cash">Cash</option>
                        <option value="upi">UPI</option>
                    </Form.Select>
                    {payment?.paymentMethod === 'cash' && paymentMethod === 'upi' && (
                        <p className="mt-1 mb-0 text-sm text-muted">
                            Changing Cash → UPI requires uploading at least one payment screenshot.
                        </p>
                    )}
                    {payment?.paymentMethod === 'upi' && paymentMethod === 'cash' && (
                        <p className="mt-1 mb-0 text-sm text-muted">
                            Changing UPI → Cash will remove saved UPI screenshots for this payment.
                        </p>
                    )}
                </Form.Group>
            </Row>

            {paymentMethod === 'upi' && (
                <>
                    <Form.Group controlId="editUpiScreenshots">
                        <Form.Label htmlFor="editUpiScreenshots">
                            UPI Screenshots (required)
                        </Form.Label>
                        <Form.Control
                            id="editUpiScreenshots"
                            type="file"
                            accept="image/*"
                            multiple
                            title="Choose UPI screenshot images"
                            onChange={handleFileChange}
                            required={
                                existingScreenshots.length === 0 && upiScreenshots.length === 0
                            }
                        />
                    </Form.Group>

                    {!!existingScreenshots.length && (
                        <div className="et-form-gallery">
                            <Form.Label>Existing Screenshots</Form.Label>
                            <div className="et-form-gallery__grid">
                                {existingScreenshots.map((url, idx) => (
                                    <div key={`${url}-${idx}`} className="et-form-gallery__item">
                                        <img src={url} alt={`Existing UPI Screenshot ${idx + 1}`} />
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
                    {loading ? 'Saving...' : 'Update Payment'}
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

export default EditPaymentForm;
