import { useState } from "react";
import api from "../api/http";
import { useAlert } from '../context/alertContext';
import { Link } from "react-router-dom";
import BackgroundWrapper from '../utils/BackgroundWrapper';
import { Form, Button } from '../components/ui';

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
            notifyError(err.response?.data?.error?.message || 'Failed to send OTP');
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
            notifyError(err.response?.data?.error?.message || 'OTP verification failed');
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
            notifyError(err.response?.data?.error?.message || 'Failed to reset password');
        }
        setLoading(false);
    };

    return (
        <BackgroundWrapper>
            <div className="w-full max-w-[420px] animate-[et-fade-up_0.28s_ease_both] rounded-[20px] border border-slate-900/10 bg-white/95 px-[1.4rem] pb-6 pt-7 text-slate-900 backdrop-blur-[14px] dark:border-slate-400/15 dark:bg-slate-900/90 dark:text-slate-200">
                {step === 1 && (
                    <>
                        <h5>Forgot Password</h5>
                        <Form.Group className="mb-3">
                            <Form.Control
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                                autoComplete="email"
                            />
                        </Form.Group>
                        <div className="text-end mb-2">
                            <Link to="/login" className="text-[0.93em] text-accent dark:text-teal-300">back to login</Link>
                        </div>
                        <Button variant="primary" className="w-100 mb-2" onClick={sendOtp} disabled={loading || !email}>
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
                                placeholder="6-digit OTP from email"
                                value={otp}
                                onChange={e => setOtp(e.target.value)}
                                required
                                inputMode="numeric"
                                autoComplete="one-time-code"
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
                                placeholder="Create a new password"
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                required
                                autoComplete="new-password"
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Control
                                type="password"
                                placeholder="Re-enter new password"
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                required
                                autoComplete="new-password"
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
