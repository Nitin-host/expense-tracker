import React, { useState } from 'react';
import { Form, Button, Alert, Spinner, InputGroup } from 'react-bootstrap';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import BackgroundWrapper from '../utils/BackgroundWrapper';

function validatePassword(password) {
    if (password.length < 6) return 'Password must be at least 6 characters.';
    if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter.';
    if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter.';
    if (!/[0-9]/.test(password)) return 'Password must contain at least one number.';
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return 'Password must contain at least one special character.';
    return '';
}

const Register = ({ onRegister, loading, error, success }) => {
    const [form, setForm] = useState({ name: '', email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [passwordError, setPasswordError] = useState('');

    const handleChange = e => {
        const { name, value } = e.target;
        setForm(f => ({ ...f, [name]: value }));
        if (name === 'password') setPasswordError(validatePassword(value));
    };

    const handleSubmit = e => {
        e.preventDefault();
        const validation = validatePassword(form.password);
        if (validation) {
            setPasswordError(validation);
            return;
        }
        onRegister(form);
    };

    return (
        <BackgroundWrapper>
            <div className="auth-card">
                <div className="text-center mb-2">
                    <img src="/logo.svg" alt="Expense Tracker Logo" style={{ width: 52, marginBottom: 5 }} />
                </div>
                <h5 className="mb-2 text-center" style={{ fontWeight: 500 }}>Create Account</h5>
                {error && <Alert variant="danger">{error}</Alert>}
                {success && <Alert variant="success">Registration successful! Please login.</Alert>}
                <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3" controlId="registerName">
                        <Form.Control name="name" type="text"
                            value={form.name} onChange={handleChange}
                            placeholder="Name" required />
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="registerEmail">
                        <Form.Control name="email" type="email"
                            value={form.email} onChange={handleChange}
                            placeholder="Email Address" required />
                    </Form.Group>
                    <Form.Group className="mb-4" controlId="registerPassword">
                        <InputGroup>
                            <Form.Control
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                value={form.password}
                                onChange={handleChange}
                                placeholder="Password"
                                required
                                minLength={6}
                                isInvalid={!!passwordError}
                            />
                            <Button
                                variant="outline-secondary"
                                type="button"
                                onClick={() => setShowPassword(v => !v)}
                                tabIndex={-1}
                            >
                                {showPassword ? <FiEyeOff /> : <FiEye />}
                            </Button>
                        </InputGroup>
                        {passwordError && (
                            <div className="invalid-feedback" style={{ display: 'block' }}>
                                {passwordError}
                            </div>
                        )}
                    </Form.Group>
                    <Button variant="primary" type="submit" disabled={loading} className="w-100 mb-2">
                        {loading ? <Spinner animation="border" size="sm" /> : 'Register'}
                    </Button>
                    <div className="text-center">
                        Already have an account? <a href="/login">Sign in</a>
                    </div>
                </Form>
            </div>
        </BackgroundWrapper>
    );
};

export default Register;
