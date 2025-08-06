import React, { useState } from 'react';
import { Form, Button, InputGroup, FormControl, Spinner } from 'react-bootstrap';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import BackgroundWrapper from '../utils/BackgroundWrapper';
import api from '../api/http';
import { useAlert } from '../utils/AlertUtil';

const getQueryParam = (param) => {
    const params = new URLSearchParams(window.location.search);
    return params.get(param) || '';
};

function validatePassword(password) {
    if (password.length < 6) return 'Password must be at least 6 characters.';
    if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter.';
    if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter.';
    if (!/[0-9]/.test(password)) return 'Password must contain at least one number.';
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return 'Password must contain at least one special character.';
    return '';
}

const ChangePassword = () => {
    const { notifySuccess, notifyError } = useAlert();
    const navigate = useNavigate();
    const initialEmail = getQueryParam('email');

    const [form, setForm] = useState({
        email: initialEmail,
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    const [showOld, setShowOld] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const [loading, setLoading] = useState(false);
    const [passwordError, setPasswordError] = useState('');
    const [confirmError, setConfirmError] = useState('');
    const [fieldError, setFieldError] = useState(''); // for general missing fields

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));

        // Clear errors on change for relevant fields
        if (name === 'newPassword') {
            setPasswordError(validatePassword(value));
            if (form.confirmPassword && form.confirmPassword !== value) {
                setConfirmError('Passwords do not match');
            } else {
                setConfirmError('');
            }
        } else if (name === 'confirmPassword') {
            setConfirmError(value !== form.newPassword ? 'Passwords do not match' : '');
        } else if (name === 'email' || name === 'oldPassword') {
            setFieldError('');
        }
    };

    const validate = () => {
        if (!form.email || !form.oldPassword || !form.newPassword || !form.confirmPassword) {
            setFieldError('Please fill in all fields.');
            return false;
        }
        const pwdError = validatePassword(form.newPassword);
        if (pwdError) {
            setPasswordError(pwdError);
            return false;
        }
        if (form.newPassword !== form.confirmPassword) {
            setConfirmError('New password and confirmation do not match.');
            return false;
        }
        setPasswordError('');
        setConfirmError('');
        setFieldError('');
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        setLoading(true);
        try {
            await api.post('/change-password', {
                email: form.email,
                oldPassword: form.oldPassword,
                newPassword: form.newPassword,
            });
            notifySuccess('Password changed successfully. Redirecting to login...');
            setForm({ email: form.email, oldPassword: '', newPassword: '', confirmPassword: '' });
            setTimeout(() => navigate('/login'), 2000);
        } catch (err) {
            notifyError(err.response?.data?.message || 'Failed to change password.');
        }
        setLoading(false);
    };

    return (
        <BackgroundWrapper>
            <div className="auth-card">
                <div className="text-center mb-2">
                    <img src="/logo.png" alt="Expense Tracker Logo" style={{ width: 52, marginBottom: 5 }} />
                </div>
                <h5 className="mb-2 text-center" style={{ fontWeight: 500 }}>Change Password</h5>

                {/* Field-level general errors */}
                {fieldError && (
                    <div className="alert alert-danger" role="alert">
                        {fieldError}
                    </div>
                )}

                <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3" controlId="changeEmail">
                        <Form.Control
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            placeholder="Email Address"
                            required
                            autoComplete="email"
                            isInvalid={!!fieldError && !form.email}
                        />
                    </Form.Group>

                    <Form.Group className="mb-3" controlId="oldPassword">
                        <InputGroup>
                            <FormControl
                                type={showOld ? 'text' : 'password'}
                                name="oldPassword"
                                value={form.oldPassword}
                                onChange={handleChange}
                                placeholder="Old Password"
                                required
                                autoComplete="current-password"
                                isInvalid={!!fieldError && !form.oldPassword}
                            />
                            <Button variant="outline-secondary" type="button" onClick={() => setShowOld(!showOld)} tabIndex={-1}>
                                {showOld ? <FiEyeOff /> : <FiEye />}
                            </Button>
                        </InputGroup>
                    </Form.Group>

                    <Form.Group className="mb-3" controlId="newPassword">
                        <InputGroup>
                            <FormControl
                                type={showNew ? 'text' : 'password'}
                                name="newPassword"
                                value={form.newPassword}
                                onChange={handleChange}
                                placeholder="New Password"
                                required
                                autoComplete="new-password"
                                isInvalid={!!passwordError}
                            />
                            <Button variant="outline-secondary" type="button" onClick={() => setShowNew(!showNew)} tabIndex={-1}>
                                {showNew ? <FiEyeOff /> : <FiEye />}
                            </Button>
                        </InputGroup>
                        {passwordError && (
                            <div className="invalid-feedback" style={{ display: 'block' }}>
                                {passwordError}
                            </div>
                        )}
                    </Form.Group>

                    <Form.Group className="mb-4" controlId="confirmPassword">
                        <InputGroup>
                            <FormControl
                                type={showConfirm ? 'text' : 'password'}
                                name="confirmPassword"
                                value={form.confirmPassword}
                                onChange={handleChange}
                                placeholder="Confirm New Password"
                                required
                                autoComplete="new-password"
                                isInvalid={!!confirmError}
                            />
                            <Button variant="outline-secondary" type="button" onClick={() => setShowConfirm(!showConfirm)} tabIndex={-1}>
                                {showConfirm ? <FiEyeOff /> : <FiEye />}
                            </Button>
                        </InputGroup>
                        {confirmError && (
                            <div className="invalid-feedback" style={{ display: 'block' }}>
                                {confirmError}
                            </div>
                        )}
                    </Form.Group>

                    <Button variant="primary" type="submit" className="w-100" disabled={loading}>
                        {loading ? <Spinner animation="border" size="sm" /> : 'Change Password'}
                    </Button>
                </Form>
            </div>
        </BackgroundWrapper>
    );
};

export default ChangePassword;
