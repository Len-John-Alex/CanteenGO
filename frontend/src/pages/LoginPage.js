import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import logo from '../assets/logo.jpeg';
import './LoginPage.css';

const LoginPage = () => {
  const [role, setRole] = useState('student');
  const [studentId, setStudentId] = useState('');
  const [staffId, setStaffId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let response;
      if (role === 'student') {
        if (!studentId || !password) {
          setError('Please enter student ID and password');
          setLoading(false);
          return;
        }
        response = await authService.loginStudent(studentId, password);
      } else {
        if (!staffId || !password) {
          setError('Please enter staff ID and password');
          setLoading(false);
          return;
        }
        response = await authService.loginStaff(staffId, password);
      }

      login(response.user, response.token);
      navigate('/dashboard');
    } catch (err) {
      if (err.response?.data?.isNotVerified) {
        if (role === 'student') {
          navigate('/verify', { state: { studentId: studentId } });
        } else {
          navigate('/staff-verify', { state: { staffId: staffId } });
        }
        return;
      }
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-logo-container">
          <img src={logo} alt="CanteenGO Logo" className="login-logo" />
          <h1>CanteenGO</h1>
        </div>
        <h2>Login</h2>

        <div className="role-selector">
          <button
            className={role === 'student' ? 'active' : ''}
            onClick={() => setRole('student')}
            type="button"
          >
            Student
          </button>
          <button
            className={role === 'staff' ? 'active' : ''}
            onClick={() => setRole('staff')}
            type="button"
          >
            Staff
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {role === 'student' ? (
            <div className="form-group">
              <label htmlFor="studentId">Student ID</label>
              <input
                type="text"
                id="studentId"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="Enter your student ID"
                disabled={loading}
              />
            </div>
          ) : (
            <div className="form-group">
              <label htmlFor="staffId">Staff ID</label>
              <input
                type="text"
                id="staffId"
                value={staffId}
                onChange={(e) => setStaffId(e.target.value)}
                placeholder="Enter your staff ID"
                disabled={loading}
              />
            </div>
          )}

          <div className="form-group password-group">
            <label htmlFor="password">Password</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                disabled={loading}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
              >
                {showPassword ? "👁️" : "🙈"}
              </button>
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        {role === 'student' && (
          <div className="register-link">
            <p>Don't have an account? <Link to="/register">Register here</Link></p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
