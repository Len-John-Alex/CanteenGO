import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import Menu from '../components/Menu';
import Notifications from '../components/Notifications';
import SpendingStats from '../components/SpendingStats';
import { useNotification } from '../context/NotificationContext';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const { showNotification } = useNotification();

  const testNotif = () => {
    showNotification('Test Notification Works! 🚀', 'success');
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        <div className="welcome-card">
          <h2>Welcome back, {user?.name}!</h2>
          <div className="user-info">
            <div className="info-item">
              <span className="info-label">Role</span>
              <span className="info-value">{user?.role?.toUpperCase()}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Student ID</span>
              <span className="info-value">{user?.studentId || user?.student_id || user?.staffId || user?.staff_id}</span>
            </div>
            {user?.email && (
              <div className="info-item">
                <span className="info-label">Email</span>
                <span className="info-value">{user?.email}</span>
              </div>
            )}
            <button className="test-notif-btn" onClick={testNotif}>
              Test Info Notification
            </button>
          </div>
        </div>

        {user?.role === 'student' && <SpendingStats />}

        <Menu />
      </div>
    </div>
  );
};

export default Dashboard;
