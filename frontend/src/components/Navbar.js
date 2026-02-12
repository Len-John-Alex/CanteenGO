import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Notifications from './Notifications';
import logo from '../assets/logo.jpeg';
import './Navbar.css';

const Navbar = ({ toggleSidebar }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="navbar">
            <div className="navbar-left">
                <button className="hamburger-btn" onClick={toggleSidebar} aria-label="Toggle Sidebar">
                    <span className="hamburger-line"></span>
                    <span className="hamburger-line"></span>
                    <span className="hamburger-line"></span>
                </button>
                <div className="navbar-brand" onClick={() => navigate('/dashboard')}>
                    <img src={logo} alt="CanteenGO Logo" className="navbar-logo" />
                </div>
            </div>

            <div className="navbar-right">
                <div className="navbar-user-info">
                    <span className="user-welcome">Welcome, {user?.name || 'User'}</span>
                </div>
                <Notifications />
                <button onClick={handleLogout} className="navbar-logout-btn">
                    Logout
                </button>
            </div>
        </nav>
    );
};

export default Navbar;
