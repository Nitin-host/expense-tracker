import React, { useState } from 'react';
import { Form, Button, Alert, Spinner, InputGroup } from './ui';
import { Link } from 'react-router-dom';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import BackgroundWrapper from '../utils/BackgroundWrapper';

function validatePassword(password) {
    if (password.length < 6) return 'Password must be at least 6 characters.';
    if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter.';
    if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter.';
    if (!/[0-9]/.test(password)) return 'Password must contain at least one number.';
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password))
        return 'Password must contain at least one special character.';
    return '';
}

const Register = ({ onRegister, loading, error, success }) => {
    const [form, setForm] = useState({ name: '', email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [passwordError, setPasswordError] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((f) => ({ ...f, [name]: value }));
        if (name === 'password') setPasswordError(validatePassword(value));
    };

    const handleSubmit = (e) => {
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
            <div className="w-full max-w-[420px] animate-[et-fade-up_0.28s_ease_both] rounded-[20px] border border-slate-900/10 bg-white/95 px-[1.4rem] pb-6 pt-7 text-slate-900 backdrop-blur-[14px] dark:border-slate-400/15 dark:bg-slate-900/90 dark:text-slate-200">
                <div className="mb-[1.35rem] text-center">
                    <img src="/logo.svg" alt="" className="mx-auto mb-2.5 h-12 w-12" />
                    <p className="mb-[0.35rem] mt-0 text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-accent dark:text-teal-300">
                        Expense Tracker
                    </p>
                    <h1 className="m-0 text-[1.55rem] font-extrabold tracking-[-0.03em]">
                        Create account
                    </h1>
                    <p className="mt-[0.35rem] mb-0 text-[0.95rem] text-muted dark:text-slate-400">
                        Start tracking shared budgets in minutes.
                    </p>
                </div>
                {error && <Alert variant="danger">{error}</Alert>}
                {success && (
                    <Alert variant="success">Registration successful! Please sign in.</Alert>
                )}
                <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3" controlId="registerName">
                        <Form.Label>Name</Form.Label>
                        <Form.Control
                            name="name"
                            type="text"
                            value={form.name}
                            onChange={handleChange}
                            placeholder="Your name"
                            required
                            autoComplete="name"
                        />
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="registerEmail">
                        <Form.Label>Email</Form.Label>
                        <Form.Control
                            name="email"
                            type="email"
                            value={form.email}
                            onChange={handleChange}
                            placeholder="you@example.com"
                            required
                            autoComplete="email"
                        />
                    </Form.Group>
                    <Form.Group className="mb-4" controlId="registerPassword">
                        <Form.Label>Password</Form.Label>
                        <InputGroup>
                            <Form.Control
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                value={form.password}
                                onChange={handleChange}
                                placeholder="Create a password"
                                required
                                minLength={6}
                                isInvalid={!!passwordError}
                                autoComplete="new-password"
                            />
                            <Button
                                variant="outline-secondary"
                                type="button"
                                onClick={() => setShowPassword((v) => !v)}
                                tabIndex={-1}
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
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
                    <Button
                        variant="primary"
                        type="submit"
                        disabled={loading}
                        className="w-100 touch-btn mb-3"
                    >
                        {loading ? <Spinner size="sm" /> : 'Create account'}
                    </Button>
                    <p className="mb-0 text-center text-[0.92rem] text-muted dark:text-slate-400">
                        Already have an account?{' '}
                        <Link to="/login" className="text-accent dark:text-teal-300">
                            Sign in
                        </Link>
                    </p>
                </Form>
            </div>
        </BackgroundWrapper>
    );
};

export default Register;
