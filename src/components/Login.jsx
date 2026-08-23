import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Form, Button, Alert, Spinner } from './ui';
import BackgroundWrapper from '../utils/BackgroundWrapper';

const Login = ({ onLogin, loading, error }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        onLogin({ email, password });
    };

    return (
        <BackgroundWrapper>
            <div className="w-full max-w-[420px] animate-[et-fade-up_0.28s_ease_both] rounded-[20px] border border-slate-900/10 bg-white/95 px-[1.4rem] pb-6 pt-7 text-slate-900 backdrop-blur-[14px] dark:border-slate-400/15 dark:bg-slate-900/90 dark:text-slate-200">
                <div className="mb-[1.35rem] text-center">
                    <img src="/logo.svg" alt="" className="mx-auto mb-2.5 h-12 w-12" />
                    <p className="mb-[0.35rem] mt-0 text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-accent dark:text-teal-300">
                        Expense Tracker
                    </p>
                    <h1 className="m-0 text-[1.55rem] font-extrabold tracking-[-0.03em]">Sign in</h1>
                    <p className="mt-[0.35rem] mb-0 text-[0.95rem] text-muted dark:text-slate-400">
                        Welcome back — pick up where you left off.
                    </p>
                </div>
                <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3" controlId="loginEmail">
                        <Form.Label>Email</Form.Label>
                        <Form.Control
                            type="email"
                            autoComplete="username"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="loginPassword">
                        <Form.Label>Password</Form.Label>
                        <Form.Control
                            type="password"
                            autoComplete="current-password"
                            placeholder="Your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </Form.Group>
                    <div className="text-end mb-3">
                        <Link
                            to="/forgot-password"
                            className="text-[0.9rem] font-medium text-accent no-underline dark:text-teal-300"
                        >
                            Forgot password?
                        </Link>
                    </div>
                    {error && <Alert variant="danger">{error}</Alert>}
                    <Button
                        variant="primary"
                        type="submit"
                        className="w-100 touch-btn mb-3"
                        disabled={loading}
                    >
                        {loading ? <Spinner size="sm" /> : 'Sign in'}
                    </Button>
                    <p className="mb-0 text-center text-[0.92rem] text-muted dark:text-slate-400">
                        Don’t have an account?{' '}
                        <Link to="/register" className="text-accent dark:text-teal-300">
                            Sign up
                        </Link>
                    </p>
                </Form>
            </div>
        </BackgroundWrapper>
    );
};

export default Login;
