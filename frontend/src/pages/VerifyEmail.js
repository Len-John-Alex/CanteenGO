import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../services/authService';
import './VerifyEmail.css';

const VerifyEmail = () => {
    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const studentId = location.state?.studentId;

    useEffect(() => {
        if (!studentId) {
            navigate('/login');
        }
    }, [studentId, navigate]);

    const handleChange = (index, value) => {
        if (isNaN(value)) return;

        const newCode = [...code];
        newCode[index] = value;
        setCode(newCode);
        setError('');

        // Auto-focus next input
        if (value !== '' && index < 5) {
            document.getElementById(`code-${index + 1}`).focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && code[index] === '' && index > 0) {
            document.getElementById(`code-${index - 1}`).focus();
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const verificationCode = code.join('');

        if (verificationCode.length !== 6) {
            setError('Please enter the full 6-digit code');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await authService.verifyEmail(studentId, verificationCode);
            setSuccess(true);
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.message || 'Verification failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="verify-container">
            <div className="verify-card">
                <h1>Email Verification</h1>
                <p>A 6-digit verification code has been sent to your email. Please enter it below to verify your account.</p>

                <form onSubmit={handleSubmit}>
                    <div className="code-input-group">
                        {code.map((digit, index) => (
                            <input
                                key={index}
                                id={`code-${index}`}
                                type="text"
                                maxLength="1"
                                value={digit}
                                onChange={(e) => handleChange(index, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(index, e)}
                                disabled={loading || success}
                                autoFocus={index === 0}
                            />
                        ))}
                    </div>

                    {error && <div className="error-message">{error}</div>}
                    {success && <div className="success-message">Email verified successfully! Redirecting to login...</div>}

                    <button type="submit" className="verify-button" disabled={loading || success}>
                        {loading ? 'Verifying...' : 'Verify Account'}
                    </button>
                </form>

                <div className="verify-footer">
                    <p>Didn't receive the code? <button className="resend-link" onClick={() => window.location.reload()}>Resend code</button></p>
                    <p><button className="back-link" onClick={() => navigate('/register')}>Back to Registration</button></p>
                </div>
            </div>
        </div>
    );
};

export default VerifyEmail;
