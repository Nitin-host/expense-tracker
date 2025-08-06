import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Form, Button, Alert, Spinner } from 'react-bootstrap';
import BackgroundWrapper from '../utils/BackgroundWrapper';

const Login = ({ onLogin, loading, error }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = e => {
        e.preventDefault();
        onLogin({ email, password });
    };

    return (
        <BackgroundWrapper>
            <div className="auth-card">
                {/* <div className="text-center mb-2">
                    <img src="/logo.png" alt="Expense Tracker Logo" style={{ width: 52, marginBottom: 5 }} />
                </div> */}
                <h5 className="mb-2 text-center" style={{ fontWeight: 500 }}>Welcome to Expense Tracker</h5>
                <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3" controlId="loginEmail">
                        <Form.Control type="email" autoComplete="username"
                            placeholder="Email Address" value={email}
                            onChange={e => setEmail(e.target.value)} required
                        />
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="loginPassword">
                        <Form.Control type="password" autoComplete="current-password"
                            placeholder="Password" value={password}
                            onChange={e => setPassword(e.target.value)} required
                        />
                    </Form.Group>
                    <div className="text-end mb-2">
                        <Link to="/change-password" style={{ fontSize: "0.93em" }}>Forgot your password?</Link>
                    </div>
                    {error && <Alert variant="danger">{error}</Alert>}
                    <Button
                        variant="primary"
                        type="submit"
                        className="w-100 mb-2"
                        disabled={loading}
                    >
                        {loading ? <Spinner animation="border" size="sm" /> : 'Sign in'}
                    </Button>
                    <div className="text-center">
                        Don’t have an account? <Link to="/register">Sign up now</Link>
                    </div>
                </Form>
            </div>
        </BackgroundWrapper>
    );
};

export default Login;
