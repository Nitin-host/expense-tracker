import { useState } from "react";
import api from "../api/http";
import { useAlert } from '../utils/AlertUtil';
import BackgroundWrapper from '../utils/BackgroundWrapper';
import { Form, Button } from 'react-bootstrap';

function ForgotPasswordFlow() {
    const { notifySuccess, notifyError } = useAlert();

    const [step, setStep] = useState(1);
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const sendOtp = async () => {
        setLoading(true);
        try {
            await api.post('/forgot-password/send-otp', { email });
            notifySuccess('OTP sent to your email');
            setStep(2);
        } catch (err) {
            notifyError(err.response?.data?.message || 'Failed to send OTP');
        }
        setLoading(false);
    };

    const verifyOtp = async () => {
        setLoading(true);
        try {
            await api.post('/forgot-password/verify-otp', { email, otp });
            notifySuccess('OTP verified. You can now reset your password.');
            setStep(3);
        } catch (err) {
            notifyError(err.response?.data?.message || 'OTP verification failed');
        }
        setLoading(false);
    };

    const resetPassword = async () => {
        if (newPassword !== confirmPassword) {
            notifyError("Passwords don't match");
            return;
        }
        setLoading(true);
        try {
            await api.post('/forgot-password/reset', { email, newPassword });
            notifySuccess('Password reset successful. Redirecting to login...');
            setTimeout(() => window.location.href = '/login', 2000);
        } catch (err) {
            notifyError(err.response?.data?.message || 'Failed to reset password');
        }
        setLoading(false);
    };

    return (
        <BackgroundWrapper>
            <div className="auth-card">
                {step === 1 && (
                    <>
                        <h5>Forgot Password</h5>
                        <Form.Group className="mb-3">
                            <Form.Control
                                type="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                            />
                        </Form.Group>
                        <Button onClick={sendOtp} disabled={loading || !email}>
                            {loading ? 'Sending...' : 'Send OTP'}
                        </Button>
                    </>
                )}

                {step === 2 && (
                    <>
                        <h5>Verify OTP</h5>
                        <Form.Group className="mb-3">
                            <Form.Control
                                type="text"
                                placeholder="Enter OTP"
                                value={otp}
                                onChange={e => setOtp(e.target.value)}
                                required
                            />
                        </Form.Group>
                        <Button onClick={verifyOtp} disabled={loading || !otp}>
                            {loading ? 'Verifying...' : 'Verify OTP'}
                        </Button>
                    </>
                )}

                {step === 3 && (
                    <>
                        <h5>Reset Password</h5>
                        <Form.Group className="mb-3">
                            <Form.Control
                                type="password"
                                placeholder="New Password"
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Control
                                type="password"
                                placeholder="Confirm Password"
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                required
                            />
                        </Form.Group>
                        <Button onClick={resetPassword} disabled={loading || !newPassword || !confirmPassword}>
                            {loading ? 'Resetting...' : 'Reset Password'}
                        </Button>
                    </>
                )}
            </div>
        </BackgroundWrapper>
    );
}

export default ForgotPasswordFlow;
