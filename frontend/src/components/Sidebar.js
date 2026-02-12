import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

const Sidebar = ({ isOpen, closeSidebar }) => {
    const { user } = useAuth();

    const studentLinks = [
        { path: '/dashboard', label: '🏠 Dashboard' },
        { path: '/my-orders', label: '📦 My Orders' },
        { path: '/cart', label: '🛒 View Cart' },
        { path: '/favourites', label: '❤️ Favourites' },
        { path: '/feedback', label: '📝 Feedback' },
    ];

    const staffLinks = [
        { path: '/dashboard', label: '🏠 Dashboard' },
        { path: '/staff-orders', label: '📊 View Orders' },
        { path: '/staff-scanner', label: '📸 Scan QR' },
        { path: '/manage-menu', label: '🍔 Manage Menu' },
        { path: '/manage-timeslots', label: '🕒 Time Slots' },
        { path: '/manage-students', label: '👥 Students' },
        { path: '/revenue', label: '💰 Revenue' },
        { path: '/staff-feedback', label: '💬 Feedback' },
        { path: '/staff-register', label: '➕ Add Staff' },
    ];

    const links = user?.role === 'staff' ? staffLinks : studentLinks;

    return (
        <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
            <div className="sidebar-header">
                <h2>Canteen Menu</h2>
                <button className="close-sidebar" onClick={closeSidebar}>×</button>
            </div>
            <nav className="sidebar-nav">
                {links.map((link) => (
                    <NavLink
                        key={link.path}
                        to={link.path}
                        className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                        onClick={closeSidebar}
                    >
                        {link.label}
                    </NavLink>
                ))}
            </nav>
        </aside>
    );
};

export default Sidebar;
