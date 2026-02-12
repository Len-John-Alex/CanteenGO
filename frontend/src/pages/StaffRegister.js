import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/authService';
import './RegisterPage.css'; // Reusing styles

const StaffRegister = () => {
    const [formData, setFormData] = useState({
        staffId: '',
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError('');
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Validation
        if (!formData.staffId || !formData.name || !formData.password || !formData.email) {
            setError('Staff ID, name, email, and password are required');
            setLoading(false);
            return;
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters long');
            setLoading(false);
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        try {
            await authService.registerStaff(
                formData.staffId,
                formData.name,
                formData.email,
                formData.password
            );

            // Redirect to verification after registration
            navigate('/staff-verify', { state: { staffId: formData.staffId } });

        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
            setLoading(false);
        }
    };

    return (
        <div className="register-container">
            <div className="register-card">
                <h1>CanteenGO</h1>
                <h2>Staff Registration</h2>

                <form onSubmit={handleRegister}>
                    <div className="form-group">
                        <label htmlFor="staffId">Staff ID *</label>
                        <input
                            type="text"
                            id="staffId"
                            name="staffId"
                            value={formData.staffId}
                            onChange={handleChange}
                            placeholder="Enter your staff ID"
                            disabled={loading}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="name">Full Name *</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Enter your full name"
                            disabled={loading}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="email">Email *</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="Enter your email"
                            disabled={loading}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password *</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Enter password (min 6 characters)"
                            disabled={loading}
                            required
                            minLength={6}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="confirmPassword">Confirm Password *</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            placeholder="Confirm your password"
                            disabled={loading}
                            required
                        />
                    </div>

                    {error && <div className="error-message">{error}</div>}

                    <button type="submit" className="register-button" disabled={loading}>
                        {loading ? 'Processing...' : 'Register'}
                    </button>
                </form>

                <div className="register-footer">
                    <p>Already have an account? <Link to="/login">Login here</Link></p>
                </div>
            </div>
        </div>
    );
};

export default StaffRegister;
